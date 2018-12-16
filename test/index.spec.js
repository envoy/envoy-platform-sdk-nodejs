const proxyquire = require('proxyquire')
const dirtyChai = require('dirty-chai')
const sinonChai = require('sinon-chai')
const sinon = require('sinon')
const chai = require('chai')
chai.use(dirtyChai)
chai.use(sinonChai)
const $ = get
const _get = require('lodash.get')
const expect = chai.expect

describe('index', function () {
  this.timeout(20e3)
  def('envoyApi', () => ({ eventUpdate: sinon.stub().resolves() }))
  def('sms', () => sinon.stub().returns({}))
  def('email', () => sinon.stub().returns({}))
  def('oauth2Routes', () => ({ connect: sinon.spy(), callback: sinon.spy() }))
  def('bugsnagHelper', () => ({ reportError: sinon.spy() }))
  def('Platform', () => proxyquire('../index.js', {
    './lib/bugsnagHelper': $.bugsnagHelper,
    './lib/oauth2Routes': $.oauth2Routes,
    './lib/sms': $.sms,
    './lib/email': $.email
  }))
  def('platform', () => new $.Platform())
  def('context', () => ({
    succeed: sinon.spy(),
    fail: sinon.spy(),
    awsRequestId: 'aws::id::test',
    logStreamName: 'logstreamname'
  }))
  def('workerEvent', () => ({ name: 'event', request_meta: { event: 'welcome' } }))
  def('workerHandler', () => function (req, res) { res.job_complete('Sent', { payload: true }) })
  def('worker', () => async () => {
    $.platform.registerWorker('welcome', $.workerHandler)
    const handler = $.platform.getHandler()
    const ret = handler($.workerEvent, $.context)
    if (ret instanceof Promise) { await ret }
  })
  def('routeEvent', () => ({ name: 'route', request_meta: { route: 'welcome' } }))
  def('routeHandler', () => function (req, res) { res.json({ welcome: true }) })
  def('route', () => async () => {
    $.platform.registerRoute('welcome', $.routeHandler)
    const handler = $.platform.getHandler()
    const ret = handler($.routeEvent, $.context)
    if (ret instanceof Promise) { await ret }
  })
  def('responsePayload', () =>
    _get($.context.succeed, 'args[0][0]') ||
    JSON.parse(_get($.context.fail, 'args[0][0]')))
  def('responseBody', () => $.responsePayload.body)
  def('responseMeta', () => $.responsePayload.meta)

  sharedExamplesFor('finished lambda event', function () {
    it('has a valid payload', async function () {
      await $.subject()
      expect($.responseMeta).to.exist()
      expect($.responseBody).to.exist()
    })
  })
  sharedExamplesFor('successful lambda event', function () {
    it('completes successfuly', async function () {
      await $.subject()
      expect($.context.succeed).to.have.been.called()
      expect($.context.fail).to.not.have.been.called()
    })
    itBehavesLike('finished lambda event')
  })
  sharedExamplesFor('failed lambda event', function () {
    it('fails', async function () {
      await $.subject()
      expect($.context.succeed).to.not.have.been.called()
      expect($.context.fail).to.have.been.called()
    })
    itBehavesLike('finished lambda event')
  })

  describe('getHandler', function () {
    describe('route', function () {
      def('subject', () => $.route)
      itBehavesLike('successful lambda event')
      it('returns payload', async function () {
        await $.subject()
        expect($.responseBody).to.deep.equal({
          json: { welcome: true }
        })
      })
      context('invalid handler', function () {
        def('routeHandler', () => 'not a function')
        itBehavesLike('failed lambda event')
      })
      context('invalid event', function () {
        def('routeEvent', () => ({ name: 'aa', request_meta: {} }))
        itBehavesLike('failed lambda event')
      })
      context('unhandled error', function () {
        def('routeHandler', () => () => { throw new Error('no') })
        itBehavesLike('failed lambda event')
        context('async', function () {
          def('routeHandler', () => async () => { throw new Error('no') })
          itBehavesLike('failed lambda event')
        })
      })
    })
    describe('worker', function () {
      def('subject', () => $.worker)
      itBehavesLike('successful lambda event')
      it('returns meta', async function () {
        await $.subject()
        expect($.responseMeta).to.deep.include({
          set_job_status: 'done',
          set_job_status_message: 'Sent'
        })
      })
      it('returns payload', async function () {
        await $.subject()
        expect($.responseBody).to.deep.equal({
          payload: true
        })
      })
      context('invalid handler', function () {
        def('workerHandler', () => 'not a function')
        itBehavesLike('successful lambda event')
        it('adds the failure metadata', async function () {
          await $.subject()
          expect($.responseMeta).to.deep.include({
            set_job_status: 'failed',
            set_job_status_message: 'Failed'
          })
        })
      })
    })
  })

  describe('getRouteLink', function () {})
  describe('getEventReportLink', function () {})
  describe('getJobLink', function () {})

  describe('hub event report', function () {
    describe('eventUpdate', function () {})
    describe('eventComplete', function () {})
    describe('eventIgnore', function () {})
    describe('eventFail', function () {})
  })
})

/*
TODO:
  - add jsdoc
  - format index to class style
  - hide unused methods (verify)
  - email, sms, requests tests
  - factor utils in platform
  - figure out route / worker autocomplete
*/
