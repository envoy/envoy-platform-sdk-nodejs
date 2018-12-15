const proxyquire = require('proxyquire')
const dirtyChai = require('dirty-chai')
const sinonChai = require('sinon-chai')
const sinon = require('sinon')
const chai = require('chai')
chai.use(dirtyChai)
chai.use(sinonChai)
const expect = chai.expect
const $ = get

describe('lib | bugsnagHelper | reportError', function () {
  beforeEach(() => { process.env.ENVOY_PLUGIN_KEY = $.pluginKey })
  afterEach(() => { delete process.env.ENVOY_PLUGIN_KEY })

  def('pluginKey', () => 'plugin-key')
  def('context', () => ({ context: 'ctx' }))
  def('user', () => ({ user: 'user' }))
  def('error', () => new Error('no'))
  def('bugsnagNotifyStub', () => sinon.stub().returns())
  def('bugsnagClientStub', () => ({ notify: $.bugsnagNotifyStub }))
  def('bugsnagConstructorStub', () => sinon.stub().returns($.bugsnagClientStub))
  def('reportError', () => proxyquire(
    '../../lib/bugsnagHelper',
    { '@bugsnag/js': $.bugsnagConstructorStub }).reportError)
  def('subject', () => () => $.reportError($.context, $.user, $.error))

  context('api key is given', function () {
    beforeEach(() => { process.env.BUGSNAG_API_KEY = 'some-bugsnag-key' })
    afterEach(() => { delete process.env.BUGSNAG_API_KEY })
    it('adds context info', function () {
      $.subject()
      expect($.bugsnagClientStub.metaData).to.deep.include($.context)
      expect($.bugsnagClientStub.metaData.pluginKey).to.equal($.pluginKey)
    })
    it('adds user info', function () {
      $.subject()
      expect($.bugsnagClientStub.user).to.deep.equal($.user)
    })
    it('notifies error', function () {
      $.subject()
      expect($.bugsnagNotifyStub).to.have.been.calledWith($.error)
    })
  })

  context('api key is not given', function () {
    it('doesn\'t attempt to notify', function () {
      $.subject()
      expect($.bugsnagNotifyStub).to.not.have.been.called()
    })
  })
})
