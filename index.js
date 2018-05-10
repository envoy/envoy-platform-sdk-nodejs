var Request = require('./lib/request');
var Response = require('./lib/response');
var utils = require('./lib/utils');
var URI = require('urijs');
var fs = require('fs');

function unhandledExceptionHandler(err) {
  console.log('Caught unhandled async exception:', err)
  process.exit()
}

function registerUnhandledExceptionHandler() {
  if (global.isUnhandledExceptionHandlerRegistered) {
    return
  }
  process.on('uncaughtException', unhandledExceptionHandler);
  global.isUnhandledExceptionHandlerRegistered = true
}

function Platform(config) {
  this.config = config;
  this._routes = {};
  this._workers = {};
  this._interceptors = {};
  var self = this;
  utils.loadHandlers(this.config.baseDir + '/routes', function(name, handler) {
    self.registerRoute(name, handler);
  });
  utils.loadHandlers(this.config.baseDir + '/workers', function(name, handler) {
    self.registerWorker(name, handler);
  });
  registerUnhandledExceptionHandler()
}
Platform.prototype.getHandler = function () {
  var self = this;
  return function (event, context, callback) {
    self.res = new Response(self, context);
    self.req = new Request(self, event, context);
    self.start_time = process.hrtime();
    self.event = event;
    self.context = context;
    try {
      if (!event.name) {
        throw new Error("Event issued did not include action.")
      }
      switch (event.name) {
      case 'route':
        self._handleRoute(event, context);
        break;
      case 'event':
        self._handleEvent(event, context);
        break;
      }
    } catch (e) {
      switch (event.name) {
      case 'route':
        self.res.error(e);
        break;
      case 'event':
        self.res.job_fail('Unhandled Exception', e.message || 'Unhandled Exception', e);
        break;
      }
    }
  }
}
Platform.prototype.registerRoute = function (name, fn) {
  this._routes[name] = fn;
}
Platform.prototype._handleRoute = function (event, context) {
  headers = event.request_meta;
  if (typeof this._routes[headers.route] !== 'function') {
    throw new Error("Invalid route configuration.");
  }
  var fn = this._routes[headers.route];
  fn.call(this, this.req, this.res);
}
Platform.prototype.registerWorker = function (event, fn) {
  this._workers[event] = fn;
}
Platform.prototype.getJobLink = function (path, localhost) {
  if(!localhost) {
    localhost = 'app.envoy.com'
    protocol = 'https'
  } else {
    protocol = 'http'
  }
  if(!this.req.job) {
    throw new Error("No job associated with this request.");
  }
  if(!this.config.key) {
    throw new Error("No plugin key in manifest.json.");
  }
  url = URI(path).absoluteTo('/platform/' + this.config.key + '/');
  url.protocol(protocol)
  url.host(localhost)
  query = url.search(true)
  query._juuid = this.req.job.id;
  url.search(query)
  return url.toString();
}
Platform.prototype._handleEvent = function (event, context) {
  headers = event.request_meta;
  if (typeof this._workers[headers.event] !== 'function') {
    throw new Error("Invalid handler configuration [" + headers.event + "]");
  }
  var fn = this._workers[headers.event];
  fn.call(this, this.req, this.res);
}
Platform.prototype.intercept = function (event, fn) {
  this._interceptors[event] = fn;
}
module.exports = Platform;
