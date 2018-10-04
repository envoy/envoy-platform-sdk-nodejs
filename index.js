const Request = require('./lib/request')
const Response = require('./lib/response')
const utils = require('./lib/utils')
const urijs = require('urijs')
const logger = require('./helpers/logger')
const Sms = require('./lib/sms')
const Email = require('./lib/email')

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
  this.config = config
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
Platform.prototype.getJobLink = function (path, localhost) {
  let protocol = 'http'
  if (!localhost) {
    localhost = 'app.envoy.com'
    protocol = 'https'
  }
  if (!this.req.job) {
    throw new Error('No job associated with this request.')
  }
  if (!this.config.key) {
    throw new Error('No plugin key in manifest.json.')
  }
  let url = urijs(path).absoluteTo('/platform/' + this.config.key + '/')
  url.protocol(protocol)
  url.host(localhost)
  let query = url.search(true)
  query._juuid = this.req.job.id
  url.search(query)
  return url.toString()
}
Platform.prototype._handleEvent = function (event, context) {
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
