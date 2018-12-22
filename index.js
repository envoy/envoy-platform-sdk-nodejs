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

class Platform {
  constructor (config) {
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

  registerRoute (name, fn) {
    this._routes[name] = fn
  }

  registerWorker (event, fn) {
    this._workers[event] = fn
  }

  getJobLink (path, queryParams = {}) {
    let jobId = get(this.req, 'job.id')
    if (!jobId) {
      throw new Error('No job associated with this request')
    }
    return this.getRouteLink(path, Object.assign(queryParams, { _juuid: jobId }))
  }

  getEventReportLink (path, queryParams = {}) {
    let hubEventId = this.req.event_report_id || this.req.params.event_report_id
    if (!hubEventId) {
      throw new Error('No hub event associated with this request')
    }
    return this.getRouteLink(path, Object.assign(queryParams, { event_report_id: hubEventId }))
  }

  getRouteLink (path, queryParams = {}) {
    if (!this.config.key) {
      throw new Error('No plugin key')
    }
    path = path.replace(/^\//, '')
    let url = urijs(`${this.config.baseUrl}/platform/${this.config.key}/${path}`).query(queryParams)
    return url.toString()
  }

  async eventUpdate (statusSummary, eventStatus = 'in_progress', failureReason = null) {
    let eventReportId = this.req.event_report_id || this.req.params.event_report_id
    this.api.updateEventReport(eventReportId, statusSummary, eventStatus, failureReason)
  }

  async eventComplete (statusMessage) {
    return this.eventUpdate(statusMessage, 'done')
  }

  async eventIgnore (statusMessage, failureReason) {
    return this.eventUpdate(statusMessage, 'ignored', failureReason)
  }

  async eventFail (statusMessage, failureReason) {
    return this.eventUpdate(statusMessage, 'failed', failureReason)
  }

  getHandler () {
    return handler.bind(this)
  }
}

// private methods
function handler (event, context, callback) {
  try {
    this.start_time = process.hrtime()
    this.event = event
    this.context = context
    this.req = new Request(this, event, context)
    this.res = new Response(this, context, getLoggingSignature.call(this))
    this.sms = new Sms(this.req)
    this.email = new Email(this.req)
    let ret = null
    if (event.name === 'route') {
      ret = handleRoute.call(this, event, context)
    } else if (event.name === 'event') {
      ret = handleEvent.call(this, event, context)
    } else {
      throw new Error('event.name needs to be either "route" or "event"')
    }
    if (ret instanceof Promise) {
      ret.catch(e => handleError.call(this, event, e))
    }
  } catch (e) {
    handleError.call(this, event, e)
  }
}

function handleEvent (event, context) {
  logger.info(getLoggingSignature.call(this), 'Platform.handleEvent', event)
  let headers = event.request_meta
  if (typeof this._workers[headers.event] !== 'function') {
    throw new Error('Invalid handler configuration [' + headers.event + ']')
  }
  let fn = this._workers[headers.event]
  return fn.call(this, this.req, this.res)
}

function handleRoute (event, context) {
  logger.info(getLoggingSignature.call(this), 'Platform.handleRoute', event)
  const headers = event.request_meta
  if (typeof this._routes[headers.route] !== 'function') {
    throw new Error('Invalid route configuration.')
  }
  const fn = this._routes[headers.route]
  return fn.call(this, this.req, this.res)
}

function handleError (event, e) {
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

function getLoggingSignature () {
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
}
*/
