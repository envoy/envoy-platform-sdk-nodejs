const Request = require('./lib/request')
const Response = require('./lib/response')
const utils = require('./lib/utils')
const urijs = require('urijs')
const logger = require('./helpers/logger')
const EnvoyApi = require('./lib/envoyApi')
const Sms = require('./lib/sms')
const Email = require('./lib/email')
const oauth2Routes = require('./lib/oauth2Routes')
const get = require('lodash.get')
const { reportError } = require('./lib/bugsnagHelper')

process.env.DEBUG = process.env.DEBUG || 'envoy*'

function Platform (config) {
  this.config = config || {}
  this.config.key = this.config.key || process.env.ENVOY_PLUGIN_KEY
  this.config.baseUrl = this.config.baseUrl || process.env.ENVOY_BASE_URL || 'https://app.envoy.com'
  this.api = new EnvoyApi(this.config.baseUrl)
  this._routes = {}
  this._workers = {}
  var self = this
  self.registerRoute('oauth/connect', oauth2Routes.connect)
  self.registerRoute('oauth/callback', oauth2Routes.callback)
  utils.loadHandlers(this.config.baseDir + '/routes', function (name, handler) {
    self.registerRoute(name, handler)
  })
  utils.loadHandlers(this.config.baseDir + '/workers', function (name, handler) {
    self.registerWorker(name, handler)
  })
}
Platform.prototype.handleError = function (event, e) {
  reportError({
    type: 'unhandled',
    ...this.event
  }, {
    company: get(this.event, 'request_meta.company'),
    location: get(this.event, 'request_meta.location')
  }, e)
  if (event.name === 'event' || (event.name === 'route' && this.req.job)) {
    return this.res.job_fail('Failed', e.message || 'unhandled_error', e)
  }
  return this.res.error(e)
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
Platform.prototype.registerRoute = function (name, fn) {
  this._routes[name] = fn
}
Platform.prototype.registerWorker = function (event, fn) {
  this._workers[event] = fn
}
Platform.prototype.getJobLink = function (path, queryParams = {}) {
  let jobId = get(this.req, 'job.id')
  if (!jobId) {
    throw new Error('No job associated with this request')
  }
  return this.getRouteLink(path, Object.assign(queryParams, { _juuid: jobId }))
}
Platform.prototype.getEventReportLink = function (path, queryParams = {}) {
  let hubEventId = this.req.event_report_id || this.req.params.event_report_id
  if (!hubEventId) {
    throw new Error('No hub event associated with this request')
  }
  return this.getRouteLink(path, Object.assign(queryParams, { event_report_id: hubEventId }))
}
Platform.prototype.getRouteLink = function (path, queryParams = {}) {
  if (!this.config.key) {
    throw new Error('No plugin key')
  }
  path = path.replace(/^\//, '')
  let url = urijs(`${this.config.baseUrl}/platform/${this.config.key}/${path}`).query(queryParams)
  return url.toString()
}
Platform.prototype.eventUpdate = async function (statusSummary, eventStatus = 'in_progress', failureReason = null) {
  let eventReportId = this.req.event_report_id || this.req.params.event_report_id
  this.api.updateEventReport(eventReportId, statusSummary, eventStatus, failureReason)
}
Platform.prototype.eventComplete = async function (statusMessage) {
  return this.eventUpdate(statusMessage, 'done')
}
Platform.prototype.eventIgnore = async function (statusMessage, failureReason) {
  return this.eventUpdate(statusMessage, 'ignored', failureReason)
}
Platform.prototype.eventFail = async function (statusMessage, failureReason) {
  return this.eventUpdate(statusMessage, 'failed', failureReason)
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
      let ret = null
      if (event.name === 'route') {
        ret = this._handleRoute(event, context)
      } else if (event.name === 'event') {
        ret = this._handleEvent(event, context)
      } else {
        throw new Error('event.name needs to be either "route" or "event"')
      }
      if (ret instanceof Promise) {
        ret.catch(e => this.handleError(event, e))
      }
    } catch (e) {
      this.handleError(event, e)
    }
  }
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
Platform.prototype._handleEvent = function (event, context) {
  logger.info(this.getLoggingSignature(), 'Platform._handleEvent', event)
  let headers = event.request_meta
  if (typeof this._workers[headers.event] !== 'function') {
    throw new Error('Invalid handler configuration [' + headers.event + ']')
  }
  let fn = this._workers[headers.event]
  return fn.call(this, this.req, this.res)
}
module.exports = Platform

/*
class Platform {
  sms
  email
  req
  res

  constructor() { }
  registerWorker() { }
  registerRoute() { }

  getJobLink() { }
  getEventReportLink() { }
  getRouteLink() { }

  eventUpdate() { }
  eventComplete() { }
  eventIgnore() { }
  eventFail() { }

  intercept?
  getEventReportLink?
}
*/
