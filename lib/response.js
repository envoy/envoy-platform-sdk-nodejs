const fs = require('fs')
const logger = require('../helpers/logger')
let Response

function errorToObject (e) {
  if (typeof e === 'string') {
    e = new Error(e)
  }
  if (e instanceof Error) {
    return Object.assign({}, {
      message: e.message,
      stack: e.stack
    }, e)
  }
  return e
}

Response = (function () {
  function Response (platform, context) {
    this._platform = platform
    this._store = {}
    this._headers = {}
    this._attachments = []
    this._http_headers = []
    this._context = context
  }
  Response.prototype.error = function (error) {
    logger.error('SDK', error)
    this._respond(errorToObject(error), 500, 'fail')
  }
  Response.prototype.store = function (ref, data) {
    if (!this._store[ref]) {
      this._store[ref] = {}
    }
    for (const x in data) {
      this._store[ref][x] = data[x]
    }
    return this
  }
  Response.prototype.job_update = function (status, data) {
    this.meta('set_job_status', 'in_progress')
    this.meta('set_job_status_message', status)
    if (data) {
      this._respond(data)
    }
  }
  Response.prototype.job_attach = function (...attachments) {
    const requiredLabels = [ 'type', 'label', 'value' ]
    for (const attachment of attachments) {
      if (!~requiredLabels.every(l => ~Object.keys(attachment).indexOf(l))) {
        throw new Error(`Attachment requires mandatory properties ${requiredLabels.join(', ')}`)
      }
    }
    this._attachments.push(...attachments)
    this.meta('set_job_attachments', JSON.stringify(this._attachments))
  }
  Response.prototype.job_ignore = function (status, reason, data) {
    this.meta('set_job_status', 'ignored')
    this.meta('set_job_status_message', status)
    this.meta('set_job_failure_message', reason)
    if (data) {
      this._respond(data)
    }
  }
  Response.prototype.job_complete = function (status, data) {
    this.meta('set_job_status', 'done')
    this.meta('set_job_status_message', status)
    if (data) {
      this._respond(data)
    }
  }
  Response.prototype.job_fail = function (status, msg, data) {
    this.meta('set_job_status', 'failed')
    this.meta('set_job_status_message', status)
    this.meta('set_job_failure_message', msg || 'unexpected_error')
    if (data) {
      this._respond(errorToObject(data))
    }
  }
  Response.prototype.plugin_fail = function (status, msg, data) {
    this.meta('set_install_status', 'failed')
    this.job_fail(status, msg, data)
  }
  Response.prototype.succeed = function (data) {
    this._respond(data || {})
  }
  Response.prototype.success = Response.prototype.succeed
  Response.prototype.raw = function (text, status) {
    this._respond({ 'body': text }, status)
  }
  Response.prototype.json = function (json, status) {
    this._respond({ 'json': json }, status)
  }
  Response.prototype.view = function (path, status) {
    this._respond({ 'html': fs.readFileSync(this._platform.config.baseDir + '/views/' + path, 'utf8') }, status)
  }
  Response.prototype.html = function (html, status) {
    this._respond({ 'html': html }, status)
  }
  Response.prototype.redirect = function (url) {
    this._respond({ 'redirect': url }, 301)
  }
  Response.prototype.http_header = function (header, value) {
    this._http_headers.push({ key: header, value: value })
  }
  Response.prototype.meta = function (header, value) {
    this._headers[header] = value
  }
  Response.prototype._respond = function (data, status, method = 'succeed') {
    logger.info(this._platform.getLoggingSignature(), 'Response._respond', `method=${method}`, `status=${status}`, `data:`, data)
    let out = { meta: {}, body: null }
    if (status) {
      out.meta.status = status
    }
    out.body = data
    if (Object.keys(this._store).find(x => Object.keys(this._store[x]).length)) {
      out.meta.store = this._store
    }
    Object.assign(out.meta, this._headers)
    if (this._http_headers.length) {
      out.meta.headers = this._http_headers
    }
    const hrtime = process.hrtime(this._platform.start_time)
    out.meta.process_time = (hrtime[0] * 1e9 + hrtime[1]) / 1e6
    if (method === 'fail') {
      out = JSON.stringify(out)
    }
    logger.info(this._platform.getLoggingSignature(), 'Response._respond', '_context', `method=${method}`, out)
    this._context[method](out)
  }
  return Response
})()
module.exports = Response
