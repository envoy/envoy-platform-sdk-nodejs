const proxyquire = require('proxyquire')
const dirtyChai = require('dirty-chai')
const sinonChai = require('sinon-chai')
const sinon = require('sinon')
const chai = require('chai')
chai.use(dirtyChai)
chai.use(sinonChai)
const $ = get
const expect = chai.expect

describe('Response', function () {
  def('Response', () => proxyquire('../../lib/response', {
    'fs': { readFileSync: $.readFileSync }
  }))
  def('readFileSync', () => sinon.stub().returns('HTML View'))
  def('response', () => new $.Response($.platform, $.context, 'prefix'))
  def('platform', () => ({
    config: {
      baseDir: '.'
    }
  }))
  def('context', () => ({
    succeed: sinon.spy(),
    fail: sinon.spy()
  }))
  def('successResponseMeta', () => $.context.succeed.args[0][0].meta)
  def('successResponseBody', () => $.context.succeed.args[0][0].body)
  def('failResponseMeta', () => JSON.parse($.context.fail.args[0][0]).meta)
  def('failResponseBody', () => JSON.parse($.context.fail.args[0][0]).body)

  function itCreatesResponse (expectedMeta, expectedBody, method = 'succeed') {
    it('should add metadata', function () {
      $.subject()
      method === 'succeed'
        ? expect($.successResponseMeta).to.deep.include(expectedMeta)
        : expect($.failResponseMeta).to.deep.include(expectedMeta)
    })
    it('should add body', function () {
      $.subject()
      method === 'succeed'
        ? expect($.successResponseBody).to.deep.equal(expectedBody)
        : expect($.failResponseBody).to.deep.include(expectedBody)
    })
  }

  describe('job actions', function () {
    describe('jobComplete', function () {
      def('subject', () => () => $.response.job_complete('Sent', { ok: true }))
      itCreatesResponse({
        'set_job_status': 'done',
        'set_job_status_message': 'Sent'
      }, { ok: true })
    })
    describe('jobIgnore', function () {
      def('subject', () => () => $.response.job_ignore('Not sent', 'no_user', { ok: true }))
      itCreatesResponse({
        'set_job_status': 'ignored',
        'set_job_status_message': 'Not sent',
        'set_job_failure_message': 'no_user'
      }, { ok: true })
    })
    describe('jobFail', function () {
      def('subject', () => () => $.response.job_fail('Not sent', 'error', { ok: false }))
      itCreatesResponse({
        'set_job_status': 'failed',
        'set_job_status_message': 'Not sent',
        'set_job_failure_message': 'error'
      }, { ok: false })
    })
    describe('jobAttach', function () {
      def('subject', () => () => {
        $.response.job_attach({
          label: 'password',
          type: 'password',
          value: '123'
        }, {
          type: 'link',
          label: 'NDA2',
          value: 'some dropbox url'
        })
        $.response.job_complete('Sent', { ok: true })
      })
      itCreatesResponse({
        'set_job_status': 'done',
        'set_job_status_message': 'Sent',
        'set_job_attachments': '[{"label":"password","type":"password","value":"123"},{"type":"link","label":"NDA2","value":"some dropbox url"}]'
      }, { ok: true })
      context('missing property', function () {
        def('subject', () => () => {
          $.response.job_attach({
            label: 'password',
            type: 'password',
            value: '123'
          }, {
            label: 'NDA2',
            value: 'some dropbox url'
          })
          $.response.job_complete('Sent', { ok: true })
        })
        it('fails', function () {
          try {
            $.subject()
          } catch (e) {
            expect(e.message).to.match(/requires mandatory properties/)
            return
          }
          throw new Error('must fail')
        })
      })
    })
    describe('jobUpdate', function () {
      def('subject', () => () => $.response.job_update('Queued', { ok: 'not yet' }))
      itCreatesResponse({
        'set_job_status': 'in_progress',
        'set_job_status_message': 'Queued'
      }, { ok: 'not yet' })
    })
    describe('pluginFail', function () {
      def('subject', () => () => $.response.plugin_fail('Not sent', 'error', { ok: false }))
      itCreatesResponse({
        'set_job_status': 'failed',
        'set_job_status_message': 'Not sent',
        'set_job_failure_message': 'error',
        'set_install_status': 'failed'
      }, { ok: false })
    })
  })
  describe('route actions', function () {
    describe('raw', function () {
      def('subject', () => () => $.response.raw('someview'))
      itCreatesResponse({ }, { body: 'someview' })
    })
    describe('json', function () {
      def('subject', () => () => $.response.json({ some: 'data' }))
      itCreatesResponse({ }, { json: { some: 'data' } })
    })
    describe('succeed', function () {
      def('subject', () => () => $.response.succeed({ some: 'data' }))
      itCreatesResponse({ }, { some: 'data' })
    })
    describe('view', function () {
      def('subject', () => () => $.response.view('someview'))
      itCreatesResponse({ }, { html: 'HTML View' })
      it('uses correct file path', function () {
        $.subject()
        expect($.readFileSync).to.have.been.calledWith('./views/someview')
      })
    })
    describe('html', function () {
      def('subject', () => () => $.response.html('someview'))
      itCreatesResponse({ }, { html: 'someview' })
    })
    describe('redirect', function () {
      def('subject', () => () => $.response.redirect('http://redirect'))
      itCreatesResponse({
        status: 301
      }, {
        redirect: 'http://redirect'
      })
    })
    describe('error', function () {
      def('subject', () => () => $.response.error(new Error('no')))
      itCreatesResponse({ }, { message: 'no' }, 'fail')
      context('error is a string', function () {
        def('subject', () => () => $.response.error('no'))
        itCreatesResponse({ }, { message: 'no' }, 'fail')
      })
    })
    describe('httpHeader', function () {
      def('subject', () => () => {
        $.response.http_header('custom-header', '123')
        $.response.json({ ok: true })
      })
      itCreatesResponse({
        headers: [{
          key: 'custom-header',
          value: '123'
        }]
      }, {
        json: {
          ok: true
        }
      })
    })
  })
  describe('meta', function () {
    def('subject', () => () => {
      $.response.meta('custom-header', '123')
      $.response.json({ ok: true })
    })
    itCreatesResponse({
      'custom-header': '123'
    }, {
      json: {
        ok: true
      }
    })
  })
})
