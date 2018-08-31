const logger = require('../helpers/logger')
const mailer = require('nodemailer')
const mandrill = require('nodemailer-mandrill-transport')
const { promisify } = require('util')
const apiKey = process.env.MANDRILL_API_KEY
const get = require('lodash.get')

class Email {
  constructor (req) {
    this.req = req
  }

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

  async sendToEntry (fromAlias, subject, messageText, messageHtml) {
    logger.info('SDK', 'sending sms to entry', messageText)
    let email = get(this.req, 'body.attributes.email') ||
        get(this.req, 'body.recipient.email')
    return this.send(email, ...arguments)
  }
}

module.exports = Email
