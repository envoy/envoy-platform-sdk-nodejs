const debug = require('debug')
const info = debug('envoy-plugin:info')
const warn = debug('envoy-plugin:warn')
const error = debug('envoy-plugin:error')
info.log = console.log.bind(console)
warn.log = console.log.bind(console)
error.log = console.log.bind(console)
module.exports = { info, warn, error }
