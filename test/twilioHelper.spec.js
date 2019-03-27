const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
const proxyquire = require('proxyquire')
chai.use(sinonChai)
chai.use(dirtyChai)

describe('twilioHelper | send', function () {
  this.timeout(40e3)
  beforeEach(function () {
    process.env = {
      E_TWILIO_SID: 'sid',
      E_TWILIO_TOKEN: 'tok',
      E_TWILIO_NUMBER: '000000000'
    }
    this.twilioSendStub = sinon.stub()
    this.twilioConstructorStub = sinon.stub().returns({
      messages: {
        create: (config, cb) => {
          this.twilioSendStub(config)
            .then(cb.bind(null, null), cb.bind(null))
        }
      }
    })
    this.subject = proxyquire('../lib/twilioHelper', {
      twilio: this.twilioConstructorStub
    }).send
  })
  let testCases = [
    ['716321124', 'CZ', '+420716321124'],
    ['7804588067', 'CA', '+17804588067'],
    // australia needs the area code given as well
    // https://www.australia.gov.au/about-australia/facts-and-figures/telephone-country-and-area-codes
    ['02 92849738', 'AU', '+61292849738']
  ]
  for (const tc of testCases) {
    it(`should process send sms request correctly :: ${tc[0]}, ${tc[1]} > ${tc[2]}`, async function () {
      this.twilioSendStub.resolves('Sent')
      let req = {
        location: {
          attributes: { country: tc[1] }
        },
        body: {
          attributes: {
            'phone-number': tc[0]
          }
        }
      }
      let ret = await this.subject(req, { message: 'Hello World' })
      expect(ret).to.equal('Sent')
      expect(this.twilioSendStub).to.have.been.calledWith({
        body: 'Hello World',
        from: '000000000',
        to: tc[2]
      })
    })
  }
  it('should process send sms requests normally if phone number format does not match country code', async function () {
    this.twilioSendStub.resolves('Sent')
    let req = {
      location: {
        attributes: { country: 'us' }
      },
      body: {
        attributes: {
          'user-data': [{
            field: 'Phone number special',
            value: '+420716321124'
          }]
        }
      }
    }
    let ret = await this.subject(req, { message: 'Hello World' })
    expect(ret).to.equal('Sent')
    expect(this.twilioSendStub).to.have.been.calledWith({
      body: 'Hello World',
      from: '000000000',
      to: '+420716321124'
    })
  })
  it('should process send sms requests normally if country is not available', async function () {
    this.twilioSendStub.resolves('Sent')
    let req = {
      body: {
        attributes: {
          'user-data': [{
            field: 'Phone number special',
            value: '+420716321124'
          }]
        }
      }
    }
    let ret = await this.subject(req, { message: 'Hello World' })
    expect(ret).to.equal('Sent')
    expect(this.twilioSendStub).to.have.been.calledWith({
      body: 'Hello World',
      from: '000000000',
      to: '+420716321124'
    })
  })
  it('should fail if country is not available and number is not internationally formatted', async function () {
    this.twilioSendStub.resolves('Sent')
    let req = {
      body: {
        attributes: {
          'user-data': [{
            field: 'Phone number special',
            value: '5165825765'
          }]
        }
      }
    }
    let ret = await this.subject(req, { message: 'Hello World' })
    expect(ret).to.equal('No valid phone number provided')
  })
  it('should not fail if country is available and number is internationally formatted with a different country', async function () {
    this.twilioSendStub.resolves('Sent')
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
            value: '+5165825765'
          }]
        }
      }
    }

    let ret = await this.subject(req, { message: 'Hello World' })
    expect(ret).to.equal('Sent')
    expect(this.twilioSendStub).to.have.been.calledWith({
      body: 'Hello World',
      from: '000000000',
      to: '+5165825765'
    })
  })
  it('should return twilio errors', async function () {
    let notSentError = new Error('Not Sent')
    this.twilioSendStub.rejects(notSentError)
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
      await this.subject(req, { message: 'Hello World' })
    } catch (e) {
      err = e
    }
    expect(err).to.exist()
    expect(this.twilioSendStub).to.have.been.calledWith({
      body: 'Hello World',
      from: '000000000',
      to: '+420716321124'
    })
  })
  it('should not send sms if missing env variables', async function () {
    delete process.env.E_TWILIO_NUMBER
    this.twilioSendStub.rejects(new Error('Should not be called'))
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
      await this.subject(req, { message: 'Hello World' })
    } catch (e) {
      err = e
    }
    expect(err).to.exist()
    expect(this.twilioSendStub).to.not.have.been.called()
  })
  it('should not send sms if phone number missing', async function () {
    this.twilioSendStub.resolves('Sent')
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
    let ret = await this.subject(req, { message: 'Hello World' })
    expect(ret).to.equal('No valid phone number provided')
    expect(this.twilioSendStub).to.not.have.been.called()
  })
  it('should not send sms if message is missing', async function () {
    this.twilioSendStub.rejects(new Error('Should not be called'))
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
    let ret = await this.subject(req, { phoneNumber: '716321124' })
    expect(ret).to.equal('No "message" option provided')
    expect(this.twilioSendStub).to.not.have.been.called()
  })
})
