const debug = require('debug')
const info = debug('envoy-plugin:info')
const warn = debug('envoy-plugin:warn')
const error = debug('envoy-plugin:error')

function log (...args) {
  args[0] = args[0]
    .replace(/^.*envoy-plugin:/, '')
    .replace(/^([^\s]+)/, `$1 :: ${global.loggingSignature} ::`)
  console.log(...args)
}

info.log = warn.log = error.log = log

module.exports = { info, warn, error }
