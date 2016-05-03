var Request;
Request = (function () {
  function Request(platform, src, context) {
    this._platform = platform;
    this._event = src;
    this._context = context;
    for (x in src.request_meta) {
      this[x] = src.request_meta[x];
    }
    this.payload = this.body = src.request_body;
  }
  return Request;
})();
module.exports = Request;

