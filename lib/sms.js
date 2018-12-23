const twilioHelper = require('./twilioHelper')
const logger = require('./logger')

/**
 * Helper to send sms based on available metadata.
 *
 * @typedef {Object} Sms
 */
class Sms {
  /**
    * Helper to send sms based on available metadata.
    *
    * @param {Request} req - Request object to get metadata from
    */
  constructor (req) {
    this.req = req
  }

  /**
    * Sends sms to a given phone number. Attempts to convert the
    * number to international format before sending to Twillio.
    *
    * @param {string} targetPhoneNumber - Phone number to send the message to
    * @param {string} messageText - Sms message
    */
  async send (targetPhoneNumber, messageText) {
    logger.info('SDK', 'sending sms to', targetPhoneNumber, 'message', messageText)
    return twilioHelper.send(this.req, {
      phoneNumber: targetPhoneNumber,
      message: messageText
    })
  }

  /**
    * Sends an sms to the visitor's phone number
    *
    * @param {string} messageText - Sms message
    */
  async sendToEntry (messageText) {
    logger.info('SDK', 'sending sms to entry', messageText)
    return twilioHelper.send(this.req, { message: messageText })
  }

  /**
    * Converts a phone number to international format based on available information.
    *
    * @param {string} phoneNumber - Phone number
    * @returns {string} Phone number in international format
    */
  async makeInternational (phoneNumber) {
    const country = this.req.location &&
      this.req.location.attributes &&
      this.req.location.attributes.country
    return twilioHelper.makeInternational(phoneNumber, country)
  }

  /**
    * Gets visitor's phone number in international format.
    * @returns {string} Phone number in international format
    */
  async getEntryInternationalPhoneNumber () {
    return this.makeInternational(twilioHelper.extractPhoneNumber(this.req.body.attributes))
  }
}

module.exports = Sms
