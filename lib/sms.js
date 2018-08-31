const twilioHelper = require('./twilioHelper')
const logger = require('../helpers/logger')

class Sms {
  constructor (req) {
    this.req = req
  }

  async send (targetPhoneNumber, messageText) {
    logger.info('SDK', 'sending sms to', targetPhoneNumber, 'message', messageText)
    return twilioHelper.send(this.req, {
      phoneNumber: targetPhoneNumber,
      message: messageText
    })
  }

  async sendToEntry (messageText) {
    logger.info('SDK', 'sending sms to entry', messageText)
    return twilioHelper.send(this.req, { message: messageText })
  }

  async makeInternational (phoneNumber) {
    const country = this.req.location &&
      this.req.location.attributes &&
      this.req.location.attributes.country
    return twilioHelper.makeInternational(phoneNumber, country)
  }
}

module.exports = Sms
