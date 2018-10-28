const Request = require('./lib/request')
const Response = require('./lib/response')
const utils = require('./lib/utils')
const urijs = require('urijs')
const logger = require('./helpers/logger')
const Sms = require('./lib/sms')
const Email = require('./lib/email')
const get = require('lodash.get')
const request = require('request-promise-native')

process.env.DEBUG = process.env.DEBUG || 'envoy*'

function unhandledExceptionHandler (err) {
  logger.error('SDK', 'Caught unhandled async exception:', err)
  process.exit()
}

function registerUnhandledExceptionHandler () {
  if (global.isUnhandledExceptionHandlerRegistered) {
    return
  }
  process.on('uncaughtException', unhandledExceptionHandler)
  global.isUnhandledExceptionHandlerRegistered = true
}

function Platform (config) {
  this.config = config || {}
  this.config.key = this.config.key || process.env.ENVOY_PLUGIN_KEY
  this.config.baseUrl = this.config.baseUrl || process.env.ENVOY_BASE_URL || 'https://app.envoy.com'
  this._routes = {}
  this._workers = {}
  this._interceptors = {}
  var self = this
  utils.loadHandlers(this.config.baseDir + '/routes', function (name, handler) {
    self.registerRoute(name, handler)
  })
  utils.loadHandlers(this.config.baseDir + '/workers', function (name, handler) {
    self.registerWorker(name, handler)
  })
  registerUnhandledExceptionHandler()
}
Platform.prototype.handleError = function (event, e) {
  if (event.name === 'event' || (event.name === 'route' && this.req.job)) {
    return this.res.job_fail('Failed', e.message || 'unhandled_error', e)
  }
  if (event.name === 'route') {
    return this.res.error(e)
  }
}
Platform.prototype.getLoggingSignature = function () {
  return [
    [ 'eventName', 'name' ],
    [ 'workerName', 'request_meta.event' ],
    [ 'routeName', 'request_meta.route' ],
    [ 'jobId', 'request_meta.job.id' ],
    [ 'eventReportId', 'event_report_id' ],
    [ 'eventReportId', 'params.event_report_id' ],
    [ 'companyId', 'request_meta.company.id' ],
    [ 'locationId', 'request_meta.location.id' ]
  ].map(e => [ e[0], get(this.event, e[1], null) ])
    .filter(e => e[1])
    .map(e => e.join('='))
    .join('; ') +
  ` ::`
}
Platform.prototype.getHandler = function () {
  return (event, context, callback) => {
    try {
      this.res = new Response(this, context)
      this.req = new Request(this, event, context)
      Object.assign(this, {
        sms: new Sms(this.req),
        email: new Email(this.req)
      })
      this.start_time = process.hrtime()
      this.event = event
      this.context = context
      if (!event.name) {
        throw new Error('Event issued did not include action.')
      }
      let ret = null
      if (event.name === 'route') {
        ret = this._handleRoute(event, context)
      }
      if (event.name === 'event') {
        ret = this._handleEvent(event, context)
      }
      if (ret instanceof Promise) {
        ret.catch(e => this.handleError(event, e))
      }
    } catch (e) {
      this.handleError(event, e)
    }
  }
}
Platform.prototype.registerRoute = function (name, fn) {
  this._routes[name] = fn
}
Platform.prototype._handleRoute = function (event, context) {
  logger.info(this.getLoggingSignature(), 'Platform._handleRoute', event)
  const headers = event.request_meta
  if (typeof this._routes[headers.route] !== 'function') {
    throw new Error('Invalid route configuration.')
  }
  const fn = this._routes[headers.route]
  return fn.call(this, this.req, this.res)
}
Platform.prototype.registerWorker = function (event, fn) {
  this._workers[event] = fn
}
Platform.prototype.getJobLink = function (path, queryParams = {}) {
  let jobId = get(this.req, 'job.id')
  if (!jobId) {
    throw new Error('No job associated with this request.')
  }
  return this.getRouteLink(path, Object.assign(queryParams, { _juuid: jobId }))
}
Platform.prototype.getEventReportLink = function (path, queryParams = {}) {
  let hubEventId = this.req.event_report_id || this.req.query.event_report_id
  if (!hubEventId) {
    throw new Error('No hub event associated with this request.')
  }
  return this.getRouteLink(path, Object.assign(queryParams, { event_report_id: hubEventId }))
}
Platform.prototype.getRouteLink = function (path, queryParams = {}) {
  if (!this.config.key) {
    throw new Error('No plugin key.')
  }
  if (!this.config.baseUrl) {
    throw new Error('No base url.')
  }
  let url = urijs(`${this.config.baseUrl}/platform/${this.config.key}/${path}`).query(queryParams)
  return url.toString()
}
Platform.prototype.eventUpdate = async function (statusSummary, failureReason = null, eventStatus = 'in_progress') {
  let eventReportId = this.req.event_report_id || this.req.params.event_report_id
  let eventReportUrl = `${this.config.baseUrl}/a/hub/v1/event_reports/${eventReportId}`
  return request.put(eventReportUrl, {
    json: true,
    body: {
      status: eventStatus,
      status_message: statusSummary,
      failure_reason: failureReason
    }
  })
}
Platform.prototype.eventComplete = async function (statusMessage) {
  return this.eventUpdate(statusMessage, null, 'done')
}
Platform.prototype.eventIgnore = async function (statusMessage, failureReason) {
  return this.eventUpdate(statusMessage, failureReason, 'ignored')
}
Platform.prototype.eventFail = async function (statusMessage, failureReason) {
  return this.eventUpdate(statusMessage, failureReason, 'failed')
}
Platform.prototype._handleEvent = function (event, context) {
  logger.info(this.getLoggingSignature(), 'Platform._handleEvent', event)
  let headers = event.request_meta
  if (typeof this._workers[headers.event] !== 'function') {
    throw new Error('Invalid handler configuration [' + headers.event + ']')
  }
  let fn = this._workers[headers.event]
  return fn.call(this, this.req, this.res)
}
Platform.prototype.intercept = function (event, fn) {
  this._interceptors[event] = fn
}
module.exports = Platform
