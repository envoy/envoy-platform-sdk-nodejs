var Response;
var fs = require('fs');
var _root = require('app-root-path');

Response = (function () {
  function Response(platform, context) {
    this._platform = platform;
    this._store = {};
    this._headers = {}
    this._http_headers = []
    this._context = context;
  }
  Response.prototype.error = function (error) {
    if (typeof error === 'string') {
      error = new Error(error);
    }
    console.log(error.stack);
    this._respond({ 'message': error.message, stack: error.stack }, 500, 'fail')
  };
  Response.prototype.store = function (ref, data) {
    if (!this._store[ref]) {
      this._store[ref] = {};
    }
    for (x in data) {
      this._store[ref][x] = data[x];
    }
    return this;
  };
  Response.prototype.job_progress = function (msg, data) {
    this.meta('set_job_status', 'in_progress');
    this.meta('job_message', msg);
    if(data) {
      this._respond(data || true);
    }
  };
  Response.prototype.job_complete = function (msg, data) {
    this.meta('set_job_status', 'done');
    this.meta('job_message', msg);
    if(data) {
      this._respond(data || true);
    }
  };
  Response.prototype.succeed = function (data) {
    this._respond(data || true);
  };
  Response.prototype.raw = function (text, status) {
    this._respond({ 'body': text }, status);
  };
  Response.prototype.json = function (json, status) {
    this._respond({ 'json': json }, status);
  };
  Response.prototype.view = function (path, status) {
    this._respond({ 'html': fs.readFileSync(_root + '/views/' + path, 'utf8') }, status);
  };
  Response.prototype.html = function (html, status) {
    this._respond({ 'html': html }, status);
  };
  Response.prototype.http_header = function (header, value) {
    this._http_headers.push({ key: header, value: value });
  };
  Response.prototype.meta = function (header, value) {
    this._headers[header] = value;
  };
  Response.prototype._respond = function (data, status, method) {
    var out = { meta: {}, body: null };
    if (status) {
      out.meta.status = status;
    }
    out.body = data;
    var ct = 0;
    for (x in this._store) {
      ct = 0;
      for (y in this._store[x]) {
        ct++
      }
      if (ct) {
        out.meta.store = this._store;
      }
    }
    for (x in this._headers) {
      out.meta[x] = this._headers[x];
    }
    if (this._http_headers.length) {
      out.meta.headers = this._http_headers;
    }
    hrtime = process.hrtime(this._platform.start_time);
    out.meta.process_time = (hrtime[0] * 1e9 + hrtime[1]) / 1e6;
    this._context[method || 'succeed'](out);
  };
  return Response;
})();
module.exports = Response;

