/**
 * Request object associated with a certain event
 * @typedef {Object} Request
 * @property {*} install - Install metadata
 * todo: add expected server side request_meta properties
 */
class Request {
  /**
   * Request object associated with a certain event
   * @param {Platform} platform Envoy Platform object that handles the event
   * @param {*} src AWS Lambda event object
   * @param {*} context AWS Lambda context object
   */
  constructor (platform, src, context) {
    this._platform = platform
    this._event = src
    this._context = context
    this.install = src.plugin_install
    Object.assign(this, src.request_meta)
    this.payload = this.body = src.request_body
  }
}

module.exports = Request
