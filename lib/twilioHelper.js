const twilio = require('twilio')
const phone = require('libphonenumber-js')
const logger = require('../helpers/logger')

function makeSureEnvVariablesExist () {
  [
    'E_TWILIO_SID',
    'E_TWILIO_TOKEN',
    'E_TWILIO_NUMBER'
  ].forEach(env => {
    if (!process.env[env]) {
      throw new Error(`${env} environment variable must be declared`)
    }
  })
}

function makeInternational (phoneNumber, countryCode) {
  if (!phoneNumber) {
    return null
  }
  try {
    const parsed = phone.parsePhoneNumber(phoneNumber, countryCode ? countryCode.toUpperCase() : undefined)
    if (parsed.isPossible()) {
      return parsed.number
    }
  } catch (err) {
  }
  return null
}

function extractPhoneNumber (attributes) {
  if (attributes['phone-number']) {
    return attributes['phone-number']
  }
  let field = attributes['user-data']
    .find(e => e.field.match(/phone|number/i) && e.value)
  return field && field.value
}

function send (req, opts) {
  try {
    logger.info('SDK', 'twilioHelper', 'send', opts)
    makeSureEnvVariablesExist()
    opts = opts || {}
    let entry = req.body
    let phoneNumber = opts.phoneNumber || extractPhoneNumber(entry.attributes)
    let country = opts.country || (
      req.location &&
      req.location.attributes &&
      req.location.attributes.country
    )
    phoneNumber = makeInternational(phoneNumber, country)
    logger.info('SDK', 'twilioHelper', 'send', `phoneNumber=${phoneNumber}`, `country=${country}`)
    if (!phoneNumber) {
      return Promise.resolve('No valid phone number provided')
    }
    if (!opts.message) {
      return Promise.resolve('No "message" option provided')
    }
    return (new Promise((resolve, reject) => {
      let twilioClient = twilio(
        process.env.E_TWILIO_SID,
        process.env.E_TWILIO_TOKEN
      )
      let config = {
        body: opts.message,
        to: phoneNumber,
        from: process.env.E_TWILIO_NUMBER
      }
      logger.info('SDK', 'twilioHelper', 'send', `twilioConfig=${JSON.stringify(config)}`)
      twilioClient.messages.create(config, (err, data) => {
        if (err) {
          logger.error('SDK', 'twilioHelper', 'send', err)
          reject(err)
        } else {
          logger.info('SDK', 'twilioHelper', 'send', 'success', data)
          resolve(data)
        }
      })
    }))
  } catch (e) {
    return Promise.reject(e)
  }
}

module.exports = {
  send,
  extractPhoneNumber,
  makeInternational
}
