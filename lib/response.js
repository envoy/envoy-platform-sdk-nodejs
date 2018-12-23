const fs = require('fs')
const _snakeCase = require('lodash.snakecase')
const logger = require('../helpers/logger')

/**
 * Response helper, with methods to configure and return the plugin response
 * * note the methods can be called in both camel case and snake case for legacy support purposes
 *
 * @typedef {Object} Response
 */
class Response {
  /**
   * Response helper, with methods to configure and return the plugin response
   *
   * @param {Platform} platform - Envoy platform instance
   * @param {*} context - AWS Lambda context object
   * @param {string} loggingPrefix - add a prefix to the response log lines)
   */
  constructor (platform, context, loggingPrefix) {
    this._platform = platform
    this._loggingPrefix = loggingPrefix
    this._headers = {}
    this._attachments = []
    this._http_headers = []
    this._context = context
    setMethodAliases(this)
    Object.keys(Response.prototype)
  }

  /**
   * Sets the job status to "in_progress" and updates status message.
   * The lambda function is completed only if the `data` parameter is given.
   * * works only if called in a job, or route with a job context
   *
   * @param {string} status - Status message
   * @param {*} data - Any detailed data object to assist debugging.
   * @example
   * // from route
   * res.jobUpdate('Queued')
   * res.json({ 'something': 'for external use' })
   * // from worker
   * res.jobUpdate('Queued', { 'some': 'debug object' })
   */
  jobUpdate (status, data = null) {
    this.meta('set_job_status', 'in_progress')
    this.meta('set_job_status_message', status)
    if (data) {
      respond.call(this, data)
    }
  }

  /**
   * Sets the job status to "ignored" and updates status message.
   * The lambda function is completed only if the `data` parameter is given.
   * * works only if called in a job, or route with a job context
   *
   * @param {string} status - Status message
   * @param {string} reason - Reason why the job is ignored
   * @param {*} data - Any detailed data object to assist debugging.
   * @example
   * // from route
   * res.jobIgnore('Not sent', 'user_not_found')
   * res.json({ 'something': 'for external use' })
   *
   * // from worker
   * res.jobIgnore('Not sent', 'user_not_found', { 'some': 'debug object' })
   */
  jobIgnore (status, reason, data) {
    this.meta('set_job_status', 'ignored')
    this.meta('set_job_status_message', status)
    this.meta('set_job_failure_message', reason)
    if (data) {
      respond.call(this, data)
    }
  }

  /**
   * Sets the job status to "done" and updates status message.
   * The lambda function is completed only if the `data` parameter is given.
   * * works only if called in a job, or route with a job context
   *
   * @param {string} status - Status message
   * @param {*} data - Any detailed data object to assist debugging.
   * @example
   * // from route
   * res.jobComplete('Sent')
   * res.json({ 'something': 'for external use' })
   *
   * // from worker
   * res.jobComplete('Sent', { 'some': 'debug object' })
   */
  jobComplete (status, data) {
    this.meta('set_job_status', 'done')
    this.meta('set_job_status_message', status)
    if (data) {
      respond.call(this, data)
    }
  }

  /**
   * Sets the job status to "failed" and updates status message.
   * The lambda function is completed only if the `data` parameter is given.
   * * works only if called in a job, or route with a job context
   *
   * @param {string} status - Status message
   * @param {*} data - Any detailed data object to assist debugging.
   * @example
   * // from route
   * res.jobFail('Queued')
   * res.json({ 'something': 'for external use' })
   *
   * // from worker
   * res.jobFail('Queued', { 'some': 'debug object' })
   */
  jobFail (status, msg, data) {
    this.meta('set_job_status', 'failed')
    this.meta('set_job_status_message', status)
    this.meta('set_job_failure_message', msg || 'unexpected_error')
    if (data) {
      respond.call(this, errorToObject(data))
    }
  }

  /**
   * Sets the job status to "failed", updates status message and *disables* the plugin.
   * The behaviour is intended for cases where a plugin is in an unrecoverable state.
   * The lambda function is completed only if the `data` parameter is given.
   * * works only if called in a job, or route with a job context
   *
   * @param {string} status - Status message
   * @param {*} data - Any detailed data object to assist debugging.
   * @example
   * // from route
   * res.pluginFail('Not sent', 'unauthorized')
   * res.json({ 'something': 'for external use' })
   *
   * // from worker
   * res.pluginFail('Not sent', 'unauthorized', { 'some': 'debug object' })
   */
  pluginFail (status, msg, data) {
    this.meta('set_install_status', 'failed')
    this.job_fail(status, msg, data)
  }

  /**
   * @typedef {Object} JobAttachment
   * @property {"username"|"password"|"link"} type - Attachment type
   * @property {string} label - Label to show in the interface
   * @property {string} value - Associated value
   */
  /**
   * Associates response attachments to a job. This information is visible to the user according to a given format.
   * * works only if called in a job, or route with a job context
   *
   * @param {JobAttachment} attachments - Attachments to associate with a job
   * @example
   * res.jobAttach({
   *  type: 'link',
   *  label: 'NDA',
   *  value: 'https://somendaurl'
   * }, {
   *  type: 'password',
   *  label: 'WiFi password',
   *  value: '123'
   * })
   */
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

  /**
   * Returns a raw object to Envoy API.
   * Generally used for routes that validate installation flow
   *
   * @param {*} data - Object to send
   * @example
   * function (req, res) {
   *  if (!req.body.mandatoryArgument) { return res.error('no') }
   *  res.succeed(req.body)
   * }
   */
  succeed (data) {
    respond.call(this, data || {})
  }

  /**
   * Returns a raw text response.
   *
   * @param {string} text - text to return
   * @param {number} status - http status code
   * @example
   * res.raw('hello')
   */
  raw (text, status = null) {
    respond.call(this, { 'body': text }, status)
  }

  /**
   * Returns a json response.
   *
   * @param {*} data - object to serialize
   * @param {number} status - http status code
   * @example
   * res.json({ ok: true })
   */
  json (data, status = null) {
    respond.call(this, { 'json': data }, status)
  }

  /**
   * Returns a html response based on a view path.
   *
   * @param {string} path - relative path to _./views_ plugin folder
   * @param {number} status - http status code
   * @example
   * res.view({ ok: true })
   */
  view (path, status = null) {
    respond.call(this, { 'html': fs.readFileSync(this._platform.config.baseDir + '/views/' + path, 'utf8') }, status)
  }

  /**
   * Returns a html response.
   *
   * @param {string} html - html code
   * @param {number} status - http status code
   * @example
   * res.html('<html></html>')
   */
  html (html, status) {
    respond.call(this, { 'html': html }, status)
  }

  /**
   * Redirects to a different endpoint
   *
   * @param {string} url - url to redirect to
   * @example
   * res.redirect('http://otherpage')
   */
  redirect (url) {
    respond.call(this, { 'redirect': url }, 301)
  }

  /**
   * Returns an error
   *
   * @param {*} error - Error object. Doesn't necessarily have to be an _Error_ object.
   * @example
   * res.error({ message: 'Not authorized' })
   */
  error (error) {
    logger.error('SDK', error)
    respond.call(this, errorToObject(error), 500, 'fail')
  }

  /**
   * Sets custom http headers
   *
   * @param {string} header - header to modify
   * @param {string} value - header value to set
   * @example
   * res.httpHeader('Content-Type', 'application/xml')
   */
  httpHeader (header, value) {
    this._http_headers.push({ key: header, value: value })
  }

  /**
   * Sets custom response meta to Envoy API
   *
   * @param {string} header - meta to modify
   * @param {*} value - value to set
   * @example
   * res.meta('set_env', { 'TOKEN': 'some::token::value' })
   */
  meta (header, value) {
    this._headers[header] = value
  }

  /**
   * DEPRECATED; DO NOT USE. Use specialized methods instead.
   */
  _respond () {
    return respond.call(this, ...arguments)
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
  // Set snake case method names for legacy plugin support. This is the only file in all
  // plugin projects that uses snake case instead of camel case.
  Object.getOwnPropertyNames(Response.prototype)
    .filter(k => typeof res[k] === 'function')
    .forEach(k => { res[_snakeCase(k)] = res[k] })
}

function respond (data, status, method = 'succeed') {
  logger.info(this._loggingPrefix, 'Response.respond', `method=${method}`, `status=${status}`, `data:`, data)
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
  logger.info(this._loggingPrefix, 'Response.respond', '_context', `method=${method}`, out)
  this._context[method](out)
}

module.exports = Response
