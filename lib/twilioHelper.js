const twilio = require('twilio')
const phone = require('libphonenumber-js')

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
  phoneNumber = phoneNumber.replace(/[^+0-9]/g, '')
  if (!countryCode) {
    return phoneNumber
  }
  let parsedPhoneNumber = phone.parse(phoneNumber, countryCode.toUpperCase())
  if (!parsedPhoneNumber.phone) {
    return phoneNumber
  }
  return phone.format(parsedPhoneNumber, 'E.164')
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
    makeSureEnvVariablesExist()
    opts = opts || {}
    let entry = req.body
    let phoneNumber = opts.phoneNumber || extractPhoneNumber(entry.attributes)
    let country = opts.country || (
      req.location &&
        req.location.attributes &&
        req.location.attributes.country
    )
    if (!phoneNumber) {
      return Promise.resolve('No phone number provided')
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
        to: makeInternational(phoneNumber, country),
        from: process.env.E_TWILIO_NUMBER
      }
      twilioClient.messages.create(config, (err, data) => {
        if (err) {
          reject(err)
        } else {
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
  makeInternational
}
