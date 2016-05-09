var Request = require('./lib/request');
var Response = require('./lib/response');
var URI = require('urijs');

function Platform(config) {
  this.config = config;
  this._routes = {};
  this._handlers = {};
  this._interceptors = {};
}
Platform.prototype.handler = function () {
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
      self.res.error(e);
    }
  }
}
Platform.prototype.route = function (name, fn) {
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
Platform.prototype.handle = function (event, fn) {
  this._handlers[event] = fn;
}
Platform.prototype.getJobLink = function (path,localhost) {
  if(!this.req.job) {
    throw new Error("No job associated with this request.");
  }
  if(!this.config.key) {
    throw new Error("No plugin key in manifest.json.");
  }
  url = URI(path).absoluteTo('/platform/'+this.config.key+'/');
  url.protocol('http')
  url.host(localhost && localhost || "localhost:3000")
  query = url.search(true)
  query._juuid = this.req.job.id;
  url.search(query)
  return url.toString();
}
Platform.prototype._handleEvent = function (event, context) {
  headers = event.request_meta;
  if (typeof this._handlers[headers.event] !== 'function') {
    throw new Error("Invalid handler configuration [" + headers.event + "]");
  }
  var fn = this._handlers[headers.event];
  fn.call(this, this.req, this.res);
}
Platform.prototype.intercept = function (event, fn) {
  this._interceptors[event] = fn;
}
module.exports = Platform;

