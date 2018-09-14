const proxyquire = require('proxyquire')
const dirtyChai = require('dirty-chai')
const sinonChai = require('sinon-chai')
const sinon = require('sinon')
const chai = require('chai')
chai.use(dirtyChai)
chai.use(sinonChai)
const expect = chai.expect
let sandbox = null

describe('index', function () {
  this.timeout(20e3)
  beforeEach(function () {
    sandbox = sinon.createSandbox()
  })
  afterEach(function () {
    sandbox.restore()
  })
  describe('route', function () {
    it('should return json if there are no issues', function () {
      let context = {
        succeed: sinon.spy(),
        fail: sinon.spy(),
        awsRequestId: 'LAMBDA_INVOKE',
        logStreamName: 'LAMBDA_INVOKE'
      }
      let routeEvent = { name: 'route', request_meta: { route: 'welcome' } }
      let Sdk = proxyquire('../index', {})
      let platformInstance = new Sdk({})
      platformInstance.registerRoute('welcome', (req, res) => res.json(['yes']))
      let handler = platformInstance.getHandler()
      handler(routeEvent, context)
      expect(context.fail).to.not.have.been.called()
      expect(context.succeed).to.have.been.called()
      let res = context.succeed.args[0][0]
      expect(res.body).to.deep.equal({ json: ['yes'] })
    })
    it('should send sms to entry if there are no issues', async function () {
      let context = {
        succeed: sinon.spy(),
        fail: sinon.spy(),
        awsRequestId: 'LAMBDA_INVOKE',
        logStreamName: 'LAMBDA_INVOKE'
      }
      let twilioSendSpy = sinon.spy()
      let routeEvent = { name: 'route', request_meta: { route: 'welcome' } }
      let Sdk = proxyquire('../index', {
        './lib/sms': proxyquire('../lib/sms', {
          './twilioHelper': {
            send: async function () {
              twilioSendSpy(...arguments)
            }
          }
        })
      })
      let platformInstance = new Sdk({})
      platformInstance.registerRoute('welcome', async function (req, res) {
        await this.sms.sendToEntry('hello')
        res.json(['yes'])
      })
      let handler = platformInstance.getHandler()
      await handler(routeEvent, context)
      expect(context.fail).to.not.have.been.called()
      expect(context.succeed).to.have.been.called()
      let res = context.succeed.args[0][0]
      expect(res.body).to.deep.equal({ json: ['yes'] })
      expect(twilioSendSpy).to.have.been.called()
      expect(twilioSendSpy.args[0][1]).to.deep.equal({ message: 'hello' })
    })
    it('should send email to entry if there are no issues', async function () {
      let context = {
        succeed: sinon.spy(),
        fail: sinon.spy(),
        awsRequestId: 'LAMBDA_INVOKE',
        logStreamName: 'LAMBDA_INVOKE'
      }
      process.env.MANDRILL_API_KEY = 'apikey'
      let mandrilSpy = sinon.spy()
      let createTransportSpy = sinon.spy()
      let sendMailSpy = sinon.spy()
      let routeEvent = { name: 'route', request_meta: { route: 'welcome' } }
      let Sdk = proxyquire('../index', {
        './lib/email': proxyquire('../lib/email', {
          'nodemailer': {
            createTransport () {
              createTransportSpy(...arguments)
              return {
                sendMail: function (opts, cb) {
                  sendMailSpy(...arguments)
                  cb(null, 'ok')
                }
              }
            }
          },
          'nodemailer-mandrill-transport': mandrilSpy
        })
      })
      let platformInstance = new Sdk({})
      platformInstance.registerRoute('welcome', async function (req, res) {
        await this.email.send('x@gmail.com', 'alias', 'hello1', 'hello2', 'hello3')
        res.json(['yes'])
      })
      let handler = platformInstance.getHandler()
      await handler(routeEvent, context)
      expect(context.fail).to.not.have.been.called()
      expect(context.succeed).to.have.been.called()
      let res = context.succeed.args[0][0]
      expect(res.body).to.deep.equal({ json: ['yes'] })
      expect(mandrilSpy).to.have.been.calledWith({ auth: { apiKey: 'apikey' } })
      expect(createTransportSpy).to.have.been.called()
      expect(sendMailSpy).to.have.been.calledWith({
        from: 'alias <no-reply@envoy.com>',
        html: 'hello3',
        subject: 'hello1',
        text: 'hello2',
        to: 'x@gmail.com'
      })
    })
    it('should call .error in case of unhandled synchronous error', function () {
      let context = {
        succeed: sinon.spy(),
        fail: sinon.spy(),
        awsRequestId: 'LAMBDA_INVOKE',
        logStreamName: 'LAMBDA_INVOKE'
      }
      let routeEvent = { name: 'route', request_meta: { route: 'welcome' } }
      let Sdk = proxyquire('../index', {})
      let platformInstance = new Sdk({})
      platformInstance.registerRoute('welcome', (req, res) => { throw new Error('no') })
      let handler = platformInstance.getHandler()
      handler(routeEvent, context)
      expect(context.fail).to.have.been.called()
      let failString = context.fail.args[0][0]
      let res = JSON.parse(failString)
      expect(res.meta.status).to.equal(500)
      expect(res.body.message).to.equal('no')
    })
    it('should call .error in case of unhandled asynchronous promise error', function (done) {
      let context = {
        succeed: sinon.spy(),
        fail: sinon.spy(),
        awsRequestId: 'LAMBDA_INVOKE',
        logStreamName: 'LAMBDA_INVOKE'
      }
      let routeEvent = { name: 'route', request_meta: { route: 'welcome' } }
      let Sdk = proxyquire('../index', {})
      let platformInstance = new Sdk({})
      platformInstance.registerRoute('welcome', (req, res) => { return Promise.reject(new Error('no')) })
      let handler = platformInstance.getHandler()
      handler(routeEvent, context)
      setTimeout(() => {
        try {
          expect(context.fail).to.have.been.called()
          let failString = context.fail.args[0][0]
          let res = JSON.parse(failString)
          expect(res.meta.status).to.equal(500)
          expect(res.body.message).to.equal('no')
          done()
        } catch (e) {
          done(e)
        }
      }, 500)
    })
  })
  describe('worker', function () {
    it('worker should add attachments on job_success', function () {
      let context = {
        succeed: sinon.spy(),
        fail: sinon.spy(),
        awsRequestId: 'LAMBDA_INVOKE',
        logStreamName: 'LAMBDA_INVOKE'
      }
      let workerEvent = { name: 'event', request_meta: { event: 'welcome' } }
      let Sdk = proxyquire('../index', {})
      let platformInstance = new Sdk({})
      platformInstance.registerWorker('welcome', function (req, res) {
        res.job_attach({
          type: 'link',
          label: 'NDA',
          value: 'some dropbox url'
        })
        res.job_attach({
          type: 'link',
          label: 'NDA2',
          value: 'some dropbox url'
        }, {
          type: 'link',
          label: 'NDA3',
          value: 'some dropbox url'
        })
        res.job_complete('Uploaded NDA', {})
      })
      let handler = platformInstance.getHandler()
      handler(workerEvent, context)
      expect(context.succeed).to.have.been.called()
      let args = context.succeed.args[0][0]
      expect(args.meta.set_job_status).to.equal('done')
      expect(args.meta.set_job_status_message).to.equal('Uploaded NDA')
      expect(JSON.parse(args.meta.set_job_attachments)).to.deep.equal([{
        type: 'link',
        label: 'NDA',
        value: 'some dropbox url'
      }, {
        type: 'link',
        label: 'NDA2',
        value: 'some dropbox url'
      }, {
        type: 'link',
        label: 'NDA3',
        value: 'some dropbox url'
      }])
      expect(args.body).to.deep.equal({})
    })
    it('worker should call .job_failed in case of unhandled synchronous error', function () {
      let context = {
        succeed: sinon.spy(),
        fail: sinon.spy(),
        awsRequestId: 'LAMBDA_INVOKE',
        logStreamName: 'LAMBDA_INVOKE'
      }
      let workerEvent = { name: 'event', request_meta: { event: 'welcome' } }
      let Sdk = proxyquire('../index', {})
      let platformInstance = new Sdk({})
      platformInstance.registerWorker('welcome', (req, res) => { throw new Error('no') })
      let handler = platformInstance.getHandler()
      handler(workerEvent, context)
      expect(context.succeed).to.have.been.called()
      let args = context.succeed.args[0][0]
      expect(args.meta.set_job_status).to.equal('failed')
      expect(args.meta.set_job_status_message).to.equal('Unhandled Exception')
      expect(args.meta.set_job_failure_message).to.equal('no')
      expect(args.body.message).to.equal('no')
    })
    it('job should call .job_failed in case of unhandled asynchronous promise error', function (done) {
      let context = {
        succeed: sinon.spy(),
        fail: sinon.spy(),
        job_failed: sinon.spy(),
        awsRequestId: 'LAMBDA_INVOKE',
        logStreamName: 'LAMBDA_INVOKE'
      }
      let routeEvent = { name: 'route', request_meta: { route: 'welcome', job: { id: 1 } } }
      let Sdk = proxyquire('../index', {})
      let platformInstance = new Sdk({})
      platformInstance.registerRoute('welcome', (req, res) => { return Promise.reject(new Error('no')) })
      let handler = platformInstance.getHandler()
      handler(routeEvent, context)
      setTimeout(() => {
        try {
          expect(context.succeed).to.have.been.called()
          let args = context.succeed.args[0][0]
          expect(args.meta.set_job_status).to.equal('failed')
          expect(args.meta.set_job_status_message).to.equal('Unhandled Exception')
          expect(args.meta.set_job_failure_message).to.equal('no')
          expect(args.body.message).to.equal('no')
          done()
        } catch (e) {
          done(e)
        }
      }, 500)
    })
  })
})
