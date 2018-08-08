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
  beforeEach(function () {
    sandbox = sinon.createSandbox()
  })
  afterEach(function () {
    sandbox.restore()
  })
  it('route should call .error in case of unhandled synchronous error', function () {
    let context = {
      done: sinon.spy(),
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
  it('worker should call .job_failed in case of unhandled synchronous error', function () {
    let context = {
      done: sinon.spy(),
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
  it('route should call .error in case of unhandled asynchronous promise error', function (done) {
    let context = {
      done: sinon.spy(),
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
  it('route with job should call .job_failed in case of unhandled asynchronous promise error', function (done) {
    let context = {
      done: sinon.spy(),
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
