const logger = require('./logger')
const mailer = require('nodemailer')
const mandrill = require('nodemailer-mandrill-transport')
const { promisify } = require('util')
const apiKey = process.env.MANDRILL_API_KEY
const get = require('lodash.get')

/**
 * Helper to send emails based on available metadata.
 *
 * @typedef {Object} Email
 */
class Email {
  /**
   * Helper to send emails based on available metadata.
   *
   * @param {Request} req - Request object to get metadata from
   */
  constructor (req) {
    this.req = req
  }

  /**
   * Sends email
   *
   * @param {string} targetEmail - Email address to send to
   * @param {string} fromAlias - Alias to display in email client
   * @param {string} subject - Email title
   * @param {string} messageText - Text-only version of the message
   * @param {string} messageHtml - Html version of the message
   * @example
   * await this.email.send(
   * 'john(a)doe.com',
   * 'Envoy <> ISE integration',
   * 'Greetings',
   * 'Hello',
   * '<b>Hello</b>'
   * )
   */
  async send (targetEmail, fromAlias, subject, messageText, messageHtml) {
    logger.info('SDK', 'sending email to', targetEmail, 'message', messageText)
    if (!apiKey) {
      throw new Error('Missing "MANDRILL_API_KEY" env variable')
    }
    if (!targetEmail) {
      throw new Error('No email provided, unable to send email')
    }
    const transporter = mailer.createTransport(mandrill({ auth: { apiKey } }))
    const opts = {
      html: messageHtml,
      from: `${fromAlias} <no-reply@envoy.com>`,
      to: targetEmail,
      subject,
      text: messageText
    }
    return promisify(transporter.sendMail).call(transporter, opts)
  }

  /**
   * Sends email to visitor
   *
   * @param {string} fromAlias - Alias to display in email client
   * @param {string} subject - Email title
   * @param {string} messageText - Text-only version of the message
   * @param {string} messageHtml - Html version of the message
   * @example
   * await this.email.sendToEntry(
    * 'Envoy <> ISE integration',
    * 'Greetings',
    * 'Hello',
    * '<b>Hello</b>'
    * )
    */
  async sendToEntry (fromAlias, subject, messageText, messageHtml) {
    logger.info('SDK', 'sending sms to entry', messageText)
    let email = get(this.req, 'body.attributes.email') ||
        get(this.req, 'body.recipient.email')
    return this.send(email, ...arguments)
  }
}

module.exports = Email
