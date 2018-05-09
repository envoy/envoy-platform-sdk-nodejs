const proxyquire = require('proxyquire')
const dirtyChai = require('dirty-chai')
const sinonChai = require('sinon-chai')
const sinon = require('sinon')
const chai = require('chai')
chai.use(dirtyChai)
chai.use(sinonChai)
const expect = chai.expect
const routeEvent = require('../events/generic.json')
let sandbox = null

describe('index', function () {
  beforeEach(function() {
    sandbox = sinon.createSandbox()
  })
  afterEach(function() {
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
  it('route should call .error in case of unhandled asynchronous error', function (done) {
    sandbox.stub(process, 'exit');
    let context = {
      done: sinon.spy(),
      succeed: sinon.spy(),
      fail: sinon.spy(),
      awsRequestId: 'LAMBDA_INVOKE',
      logStreamName: 'LAMBDA_INVOKE'
    }
    let Sdk = proxyquire('../index', {})
    let platformInstance = new Sdk({})
    platformInstance.registerRoute('welcome', (req, res) => {
      setTimeout(function () { throw new Error('no') }, 500)
    })
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
      } catch(e) { done(e) }
    }, 600)
  })
})
