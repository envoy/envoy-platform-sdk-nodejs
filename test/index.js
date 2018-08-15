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
          'envoy-plugin-twilio-notification-helper': {
            send: async function () {
              twilioSendSpy(...arguments)
            }
          }
        })
      })
      let platformInstance = new Sdk({})
      platformInstance.registerRoute('welcome', async (req, res, ctx) => {
        await ctx.sms.sendToEntry('hello')
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
  describe('worker', function () {
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
  })
})
