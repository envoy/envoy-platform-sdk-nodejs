const fs = require('fs')
const _snakeCase = require('lodash.snakecase')
const logger = require('../helpers/logger')

class Response {
  constructor (platform, context, loggingPrefix) {
    this._platform = platform
    this._loggingPrefix = loggingPrefix
    this._headers = {}
    this._attachments = []
    this._http_headers = []
    this._context = context
    setMethodAliases(this)
  }

  error (error) {
    logger.error('SDK', error)
    this._respond(errorToObject(error), 500, 'fail')
  }

  jobUpdate (status, data) {
    this.meta('set_job_status', 'in_progress')
    this.meta('set_job_status_message', status)
    if (data) {
      this._respond(data)
    }
  }

  jobAttach (...attachments) {
    const requiredLabels = [ 'type', 'label', 'value' ]
    for (const attachment of attachments) {
      if (!requiredLabels.every(l => ~Object.keys(attachment).indexOf(l))) {
        throw new Error(`Attachment requires mandatory properties ${requiredLabels.join(', ')}`)
      }
    }
    this._attachments.push(...attachments)
    this.meta('set_job_attachments', JSON.stringify(this._attachments))
  }

  jobIgnore (status, reason, data) {
    this.meta('set_job_status', 'ignored')
    this.meta('set_job_status_message', status)
    this.meta('set_job_failure_message', reason)
    if (data) {
      this._respond(data)
    }
  }

  jobComplete (status, data) {
    this.meta('set_job_status', 'done')
    this.meta('set_job_status_message', status)
    if (data) {
      this._respond(data)
    }
  }

  jobFail (status, msg, data) {
    this.meta('set_job_status', 'failed')
    this.meta('set_job_status_message', status)
    this.meta('set_job_failure_message', msg || 'unexpected_error')
    if (data) {
      this._respond(errorToObject(data))
    }
  }

  pluginFail (status, msg, data) {
    this.meta('set_install_status', 'failed')
    this.job_fail(status, msg, data)
  }

  succeed (data) {
    this._respond(data || {})
  }

  raw (text, status) {
    this._respond({ 'body': text }, status)
  }

  json (json, status) {
    this._respond({ 'json': json }, status)
  }

  view (path, status) {
    this._respond({ 'html': fs.readFileSync(this._platform.config.baseDir + '/views/' + path, 'utf8') }, status)
  }

  html (html, status) {
    this._respond({ 'html': html }, status)
  }

  redirect (url) {
    this._respond({ 'redirect': url }, 301)
  }

  httpHeader (header, value) {
    this._http_headers.push({ key: header, value: value })
  }

  meta (header, value) {
    this._headers[header] = value
  }
  _respond (data, status, method = 'succeed') {
    logger.info(this._loggingPrefix, 'Response._respond', `method=${method}`, `status=${status}`, `data:`, data)
    let out = { meta: {}, body: null }
    if (status) {
      out.meta.status = status
    }
    out.body = data
    Object.assign(out.meta, this._headers)
    if (this._http_headers.length) {
      out.meta.headers = this._http_headers
    }
    const hrtime = process.hrtime(this._platform.start_time)
    out.meta.process_time = (hrtime[0] * 1e9 + hrtime[1]) / 1e6
    if (method === 'fail') {
      out = JSON.stringify(out)
    }
    logger.info(this._loggingPrefix, 'Response._respond', '_context', `method=${method}`, out)
    this._context[method](out)
  }
}

// private
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

function setMethodAliases (res) {
  res.success = res.succeed
  Object.getOwnPropertyNames(Response.prototype)
    .filter(k => typeof res[k] === 'function')
    .forEach(k => {
      console.log(k)
      res[_snakeCase(k)] = res[k]
    })
}

module.exports = Response
