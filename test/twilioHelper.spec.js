const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
const proxyquire = require('proxyquire')
chai.use(sinonChai)
chai.use(dirtyChai)

describe('twilio send', function () {
  it('should process send sms request correctly', async function () {
    process.env = {
      E_TWILIO_SID: 'sid',
      E_TWILIO_TOKEN: 'tok',
      E_TWILIO_NUMBER: '000000000'
    }
    let tConstructorSpy = sinon.spy()
    let sendSpy = sinon.spy()
    let send = proxyquire('../lib/twilioHelper', {
      twilio: function () {
        tConstructorSpy(...arguments)
        return {
          messages: {
            create: function (config, cb) {
              sendSpy(config, cb)
              cb(null, 'Sent')
            }
          }
        }
      }
    }).send
    let req = {
      location: {
        attributes: {
          country: 'cz'
        }
      },
      body: {
        attributes: {
          'phone-number': '716321124'
        }
      }
    }
    let ret = await send(req, { message: 'Hello World' })
    expect(ret).to.equal('Sent')
    expect(sendSpy).to.have.been.calledWith({
      body: 'Hello World',
      from: '000000000',
      to: '+420716321124'
    })
  })
  it('should process send sms requests normally if phone number format does not match country code', async function () {
    process.env = {
      E_TWILIO_SID: 'sid',
      E_TWILIO_TOKEN: 'tok',
      E_TWILIO_NUMBER: '000000000'
    }
    let tConstructorSpy = sinon.spy()
    let sendSpy = sinon.spy()
    let send = proxyquire('../lib/twilioHelper', {
      twilio: function () {
        tConstructorSpy(...arguments)
        return {
          messages: {
            create: function (config, cb) {
              sendSpy(config, cb)
              cb(null, 'Sent')
            }
          }
        }
      }
    }).send
    let req = {
      location: {
        attributes: {
          country: 'us'
        }
      },
      body: {
        attributes: {
          'user-data': [{
            field: 'Phone number special',
            value: '716321124'
          }]
        }
      }
    }
    let ret = await send(req, { message: 'Hello World' })
    expect(ret).to.equal('Sent')
    expect(sendSpy).to.have.been.calledWith({
      body: 'Hello World',
      from: '000000000',
      to: '716321124'
    })
  })
  it('should process send sms requests normally if country is not available', async function () {
    process.env = {
      E_TWILIO_SID: 'sid',
      E_TWILIO_TOKEN: 'tok',
      E_TWILIO_NUMBER: '000000000'
    }
    let tConstructorSpy = sinon.spy()
    let sendSpy = sinon.spy()
    let send = proxyquire('../lib/twilioHelper', {
      twilio: function () {
        tConstructorSpy(...arguments)
        return {
          messages: {
            create: function (config, cb) {
              sendSpy(config, cb)
              cb(null, 'Sent')
            }
          }
        }
      }
    }).send
    let req = {
      body: {
        attributes: {
          'user-data': [{
            field: 'Phone number special',
            value: '716321124'
          }]
        }
      }
    }
    let ret = await send(req, { message: 'Hello World' })
    expect(ret).to.equal('Sent')
    expect(sendSpy).to.have.been.calledWith({
      body: 'Hello World',
      from: '000000000',
      to: '716321124'
    })
  })
  it('should return twilio errors', async function () {
    process.env = {
      E_TWILIO_SID: 'sid',
      E_TWILIO_TOKEN: 'tok',
      E_TWILIO_NUMBER: '000000000'
    }
    let tConstructorSpy = sinon.spy()
    let sendSpy = sinon.spy()
    let notSentError = new Error('Not Sent')
    let send = proxyquire('../lib/twilioHelper', {
      twilio: function () {
        tConstructorSpy(...arguments)
        return {
          messages: {
            create: function (config, cb) {
              sendSpy(config, cb)
              cb(notSentError)
            }
          }
        }
      }
    }).send
    let req = {
      location: {
        attributes: {
          country: 'cz'
        }
      },
      body: {
        attributes: {
          'user-data': [{
            field: 'Phone number special',
            value: '716321124'
          }]
        }
      }
    }
    let err
    try {
      await send(req, { message: 'Hello World' })
    } catch (e) {
      err = e
    }
    expect(err).to.exist()
    expect(sendSpy).to.have.been.calledWith({
      body: 'Hello World',
      from: '000000000',
      to: '+420716321124'
    })
  })
  it('should not send sms if missing env variables', async function () {
    process.env = {
      E_TWILIO_SID: 'sid',
      E_TWILIO_TOKEN: 'tok'
    }
    let tConstructorSpy = sinon.spy()
    let sendSpy = sinon.spy()
    let send = proxyquire('../lib/twilioHelper', {
      twilio: function () {
        tConstructorSpy(...arguments)
        return {
          messages: {
            create: function (config, cb) {
              sendSpy(config, cb)
              cb(new Error('Should not be called'))
            }
          }
        }
      }
    }).send
    let req = {
      location: {
        attributes: {
          country: 'cz'
        }
      },
      body: {
        attributes: {
          'user-data': [{
            field: 'Phone number special',
            value: '716321124'
          }]
        }
      }
    }
    let err
    try {
      await send(req, { message: 'Hello World' })
    } catch (e) {
      err = e
    }
    expect(err).to.exist()
    expect(sendSpy).to.not.have.been.called()
  })
  it('should not send sms if phone number missing', async function () {
    process.env = {
      E_TWILIO_SID: 'sid',
      E_TWILIO_TOKEN: 'tok',
      E_TWILIO_NUMBER: '000000000'
    }
    let tConstructorSpy = sinon.spy()
    let sendSpy = sinon.spy()
    let send = proxyquire('../lib/twilioHelper', {
      twilio: function () {
        tConstructorSpy(...arguments)
        return {
          messages: {
            create: function (config, cb) {
              sendSpy(config, cb)
              cb(new Error('Should not be called'))
            }
          }
        }
      }
    }).send
    let req = {
      location: {
        country: 'cz'
      },
      body: {
        attributes: {
          'user-data': []
        }
      }
    }
    let ret = await send(req, { message: 'Hello World' })
    expect(ret).to.equal('No phone number provided')
    expect(sendSpy).to.not.have.been.called()
  })
  it('should not send sms if message is missing', async function () {
    process.env = {
      E_TWILIO_SID: 'sid',
      E_TWILIO_TOKEN: 'tok',
      E_TWILIO_NUMBER: '000000000'
    }
    let tConstructorSpy = sinon.spy()
    let sendSpy = sinon.spy()
    let send = proxyquire('../lib/twilioHelper', {
      twilio: function () {
        tConstructorSpy(...arguments)
        return {
          messages: {
            create: function (config, cb) {
              sendSpy(config, cb)
              cb(new Error('Should not be called'))
            }
          }
        }
      }
    }).send
    let req = {
      location: {
        attributes: {
          country: 'cz'
        }
      },
      body: {
        attributes: {
          'user-data': []
        }
      }
    }
    let ret = await send(req, { phoneNumber: '716321124' })
    expect(ret).to.equal('No "message" option provided')
    expect(sendSpy).to.not.have.been.called()
  })
})
