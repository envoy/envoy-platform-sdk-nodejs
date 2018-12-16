const proxyquire = require('proxyquire')
const dirtyChai = require('dirty-chai')
const sinonChai = require('sinon-chai')
const sinon = require('sinon')
const chai = require('chai')
chai.use(dirtyChai)
chai.use(sinonChai)
const $ = get
const expect = chai.expect

describe('index', function () {
  this.timeout(20e3)
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
  def('responsePayload', () => $.context.succeed.args[0][0])
  def('responseBody', () => $.responsePayload.body)
  def('responseMeta', () => $.responsePayload.meta)

  sharedExamplesFor('successful event', function () {
    it('completes successfuly', async function () {
      await $.subject()
      expect($.context.succeed).to.have.been.called()
      expect($.context.fail).to.not.have.been.called()
    })
  })
  describe('getHandler', function () {
    describe('route', function () {
      def('subject', () => $.route)
      itBehavesLike('successful event')
      it('returns payload', async function () {
        await $.subject()
        expect($.responseBody).to.deep.equal({
          json: { welcome: true }
        })
      })
    })
    describe('worker', function () {
      def('subject', () => $.worker)
      itBehavesLike('successful event')
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
    })
  })
  describe('getRouteLink', function () {})
  describe('getEventReportLink', function () {})
  describe('getJobLink', function () {})
  describe('hub event report', function () {
    describe('eventComplete', function () {})
    describe('eventIgnore', function () {})
    describe('eventFail', function () {})
    describe('eventUpdate', function () {})
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
