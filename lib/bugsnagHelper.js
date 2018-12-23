const bugsnag = require('@bugsnag/js')
const logger = require('./logger')
const bugsnagApiKey = process.env.BUGSNAG_API_KEY
const bugsnagClient = bugsnagApiKey && bugsnag(bugsnagApiKey)

function reportError (context, user, error) {
  logger.info('bugsnagReport', ...arguments)
  if (!bugsnagClient) {
    logger.error('bugsnagReport', 'no client')
    return
  }
  bugsnagClient.metaData = context
  bugsnagClient.user = user
  bugsnagClient.metaData.pluginKey = process.env.ENVOY_PLUGIN_KEY
  bugsnagClient.notify(error)
}

module.exports = { reportError }
