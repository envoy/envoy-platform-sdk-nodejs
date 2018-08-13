const debug = require('debug')
const info = debug('envoy-plugin:info')
const warn = debug('envoy-plugin:warn')
const error = debug('envoy-plugin:error')

module.exports = { info, warn, error }
