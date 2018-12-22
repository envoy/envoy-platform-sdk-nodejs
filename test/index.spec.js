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
  beforeEach(function () {
    process.env.ENVOY_PLUGIN_KEY = 'skype'
  })
  afterEach(function () {
    delete process.env.ENVOY_PLUGIN_KEY
    sinon.restore()
  })
  def('EnvoyApi', () => sinon.stub().returns($.envoyApi))
  def('envoyApi', () => ({ updateEventReport: sinon.stub().resolves() }))
  def('sms', () => sinon.stub().returns({}))
  def('email', () => sinon.stub().returns({}))
  def('oauth2Routes', () => ({ connect: $.routeHandler, callback: $.routeHandler }))
  def('bugsnagHelper', () => ({ reportError: sinon.spy() }))
  /* eslint-disable standard/no-callback-literal */
  def('loadHandlers', () => (path, cb) =>
    cb('welcome', path.match(/route/) ? $.routeHandler : $.workerHandler))
  /* eslint-enable standard/no-callback-literal */
  def('Platform', () => proxyquire('../index.js', {
    './lib/bugsnagHelper': $.bugsnagHelper,
    './lib/oauth2Routes': $.oauth2Routes,
    './lib/sms': $.sms,
    './lib/email': $.email,
    './lib/envoyApi': $.EnvoyApi,
    './lib/utils': { loadHandlers: $.loadHandlers }
  }))
  def('platform', () => new $.Platform({ baseDir: '.' }))
  def('context', () => ({
    succeed: sinon.spy(),
    fail: sinon.spy(),
    awsRequestId: 'aws::id::test',
    logStreamName: 'logstreamname'
  }))
  def('params', () => ({}))
  def('job', () => ({ id: 'job::id' }))
  def('workerEvent', () => ({
    name: 'event',
    request_meta: {
      event: 'welcome',
      job: $.job,
      params: $.params
    }
  }))
  def('routeName', () => 'welcome')
  def('routeEvent', () => ({
    name: 'route',
    request_meta: {
      route: $.routeName,
      params: $.params
    }
  }))
  def('event', () => $.routeEvent)
  def('workerHandler', () => function (req, res) { res.job_complete('Sent', { payload: true }) })
  def('routeHandler', () => function (req, res) { res.json({ welcome: true }) })
  def('subject', () => async () => {
    const handler = $.platform.getHandler()
    const ret = handler($.event, $.context)
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
  sharedExamplesFor('successful route', function () {
    itBehavesLike('successful lambda event')
  })
  sharedExamplesFor('failed route', function () {
    itBehavesLike('failed lambda event')
  })
  sharedExamplesFor('successful worker', function () {
    itBehavesLike('successful lambda event')
    it('returns meta', async function () {
      await $.subject()
      expect($.responseMeta).to.deep.include({
        set_job_status: 'done'
      })
    })
    it('returns payload', async function () {
      await $.subject()
      expect($.responseBody).to.exist()
    })
  })
  sharedExamplesFor('failed worker', function () {
    itBehavesLike('successful lambda event')
    it('adds the failure metadata', async function () {
      await $.subject()
      expect($.responseMeta).to.deep.include({
        set_job_status: 'failed'
      })
    })
  })

  describe('route', function () {
    def('event', () => $.routeEvent)
    itBehavesLike('successful route')
    it('returns payload', async function () {
      await $.subject()
      expect($.responseBody).to.deep.equal({
        json: { welcome: true }
      })
    })
    context('invalid handler', function () {
      def('routeHandler', () => 'not a function')
      itBehavesLike('failed route')
    })
    context('invalid event', function () {
      def('routeEvent', () => ({ name: 'aa', request_meta: {} }))
      itBehavesLike('failed route')
    })
    context('unhandled error', function () {
      def('routeHandler', () => () => { throw new Error('no') })
      itBehavesLike('failed route')
      context('async', function () {
        def('routeHandler', () => async () => { throw new Error('no') })
        itBehavesLike('failed route')
      })
    })
    context('oauth', function () {
      context('connect', function () {
        def('routeName', () => 'oauth/connect')
        itBehavesLike('successful route')
      })
      context('callback', function () {
        def('routeName', () => 'oauth/callback')
        itBehavesLike('successful route')
      })
    })
  })

  describe('worker', function () {
    def('event', () => $.workerEvent)
    itBehavesLike('successful worker')
    it('returns meta', async function () {
      await $.subject()
      expect($.responseMeta).to.deep.include({
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
      itBehavesLike('failed worker')
      it('adds status message', async function () {
        await $.subject()
        expect($.responseMeta).to.deep.include({
          set_job_status_message: 'Failed'
        })
      })
    })
  })

  describe('event helpers', function () {
    def('event', () => $.workerEvent)
    def('url', () => sinon.spy())
    describe('getRouteLink', function () {
      def('workerHandler', () => async function (req, res) {
        $.url(this.getRouteLink('/url'))
        res.job_complete('Ok', {})
      })
      itBehavesLike('successful worker')
      it('should return route link', async function () {
        await $.subject()
        expect($.url).to.have.been.calledWith(
          'https://app.envoy.com/platform/skype/url')
      })
      context('undefined plugin key', function () {
        beforeEach(function () {
          delete process.env.ENVOY_PLUGIN_KEY
        })
        itBehavesLike('failed worker')
        it('fails', async function () {
          await $.subject()
          expect($.responseMeta).to.deep.include({
            set_job_failure_message: 'No plugin key'
          })
        })
      })
    })
    describe('getJobLink', function () {
      def('workerHandler', () => async function (req, res) {
        $.url(this.getJobLink('/url'))
        res.job_complete('Ok', {})
      })
      itBehavesLike('successful worker')
      it('should return route link', async function () {
        await $.subject()
        expect($.url).to.have.been.calledWith(
          'https://app.envoy.com/platform/skype/url?_juuid=job%3A%3Aid')
      })
      context('with no job id', function () {
        def('job', () => null)
        itBehavesLike('failed worker')
        it('fails', async function () {
          await $.subject()
          expect($.responseMeta).to.deep.include({
            set_job_failure_message: 'No job associated with this request'
          })
        })
      })
    })
  })

  describe('hub event helpers', function () {
    def('params', () => ({
      ...$.params,
      event_report_id: 'hub::event::id'
    }))

    sharedExamplesFor('updates hub event report', function () {
      it('updates hub event report', async function () {
        await $.subject()
        expect($.envoyApi.updateEventReport).to.have.been.calledWith(
          $.expectedEventReport.id,
          $.expectedEventReport.summary,
          $.expectedEventReport.status,
          $.expectedEventReport.failureReason
        )
      })
    })

    describe('eventUpdate', function () {
      def('routeHandler', () => async function (req, res) {
        await this.eventUpdate('Sent')
        res.json({ welcome: true })
      })
      itBehavesLike('successful route')
      itBehavesLike('updates hub event report')
      def('expectedEventReport', () => ({
        id: 'hub::event::id',
        status: 'in_progress',
        summary: 'Sent',
        failureReason: null
      }))
    })
    describe('eventComplete', function () {
      def('routeHandler', () => async function (req, res) {
        await this.eventComplete('Sent')
        res.json({ welcome: true })
      })
      itBehavesLike('successful route')
      itBehavesLike('updates hub event report')
      def('expectedEventReport', () => ({
        id: 'hub::event::id',
        status: 'done',
        summary: 'Sent',
        failureReason: null
      }))
    })
    describe('eventIgnore', function () {
      def('routeHandler', () => async function (req, res) {
        await this.eventIgnore('Not Sent', 'User not found')
        res.json({ welcome: true })
      })
      itBehavesLike('successful route')
      itBehavesLike('updates hub event report')
      def('expectedEventReport', () => ({
        id: 'hub::event::id',
        status: 'ignored',
        summary: 'Not Sent',
        failureReason: 'User not found'
      }))
    })
    describe('eventFail', function () {
      def('routeHandler', () => async function (req, res) {
        await this.eventFail('Not Sent', 'Not enough credit')
        res.json({ welcome: true })
      })
      itBehavesLike('successful route')
      itBehavesLike('updates hub event report')
      def('expectedEventReport', () => ({
        id: 'hub::event::id',
        status: 'failed',
        summary: 'Not Sent',
        failureReason: 'Not enough credit'
      }))
    })
    describe('getEventReportLink', function () {
      def('routeHandler', () => async function (req, res) {
        res.json({ url: this.getEventReportLink('/url') })
      })
      itBehavesLike('successful route')
      it('should return route link', async function () {
        await $.subject()
        expect($.responseBody.json.url).to.equal(
          'https://app.envoy.com/platform/skype/url?event_report_id=hub%3A%3Aevent%3A%3Aid')
      })
      context('no event id', function () {
        def('params', () => ({
          ...$.params,
          event_report_id: null
        }))
        itBehavesLike('failed route')
        it('fails', async function () {
          await $.subject()
          expect($.responseBody.message).to.equal(
            'No hub event associated with this request')
        })
      })
    })
  })
})

/*
TODO:
  - add jsdoc
  - format index to class style
  - email, sms, requests tests
  - figure out route / worker autocomplete
*/
