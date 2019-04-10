var Request
Request = (function () {
  function Request (platform, src, context) {
    this._platform = platform
    this._event = src
    this.install = src.plugin_install
    this._context = context
    for (const x in src.request_meta) {
      this[x] = src.request_meta[x]
    }
    this.payload = this.body = src.request_body
    this.storage = (this.install.plugin_storage_items || []).reduce((storage, item) => {
      storage[item.key] = item.value
      return storage
    }, {})
  }
  return Request
})()
module.exports = Request
