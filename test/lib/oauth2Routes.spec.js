const nock = require('nock')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const chai = require('chai')
const dirtyChai = require('dirty-chai')
const sinonChai = require('sinon-chai')
chai.use(dirtyChai)
chai.use(sinonChai)
const expect = chai.expect
const $ = get

describe('lib | oauth2Routes', function () {
  beforeEach(function () {
    this.randomStub = sinon.stub(Math, 'random')
    this.randomStub.returns($.random)
    Object.assign(process.env, {
      OAUTH_DEFAULT_CLIENT_ID: 'clientid',
      OAUTH_DEFAULT_CLIENT_SECRET: 'clientsecret',
      OAUTH_DEFAULT_SITE: 'https://site',
      OAUTH_DEFAULT_TOKEN_URL: '/token',
      OAUTH_DEFAULT_AUTHORIZE_URL: 'https://site/authorize',
      OAUTH_DEFAULT_REDIRECT_HOST: 'https://not.app.envoy.com',
      OAUTH_DEFAULT_SCOPE: 'a, b, c'
    })
    nock('https://site')
      .post('/token', 'redirect_uri=https%3A%2F%2Fnot.app.envoy.com%2Fplatform%2Fslack%2Foauth2%2Fdefault%2Fcallback&code=somecode&grant_type=authorization_code&client_id=clientid&client_secret=clientsecret')
      .reply(200, JSON.stringify({
        accessToken: 'at',
        refreshToken: 'rt'
      }))
  })
  afterEach(function () {
    this.randomStub.restore()
    nock.cleanAll()
  })
  def('random', () => 7e-9)
  def('oauth2', () => proxyquire('../../lib/oauth2Routes', {}))
  def('res', () => ({
    meta: sinon.spy(),
    redirect: sinon.spy(),
    html: sinon.spy(),
    error: sinon.spy()
  }))
  def('req', () => ({
    env: $.env,
    params: $.params
  }))
  def('params', () => ({
    app: 'default',
    key: 'slack'
  }))
  def('env', () => ({}))

  describe('connect', function () {
    def('subject', () => () => $.oauth2.connect($.req, $.res))
    it('sets temp token', function () {
      $.subject()
      expect($.res.meta).to.have.been.calledWith('set_env', {
        OAUTH_DEFAULT_TEMP_TOKEN: '7'
      })
    })
    it('redirects to authoriztion url', function () {
      $.subject()
      expect($.res.redirect).to.have.been.calledWith(
        'https://site/authorize?response_type=code&client_id=clientid&redirect_uri=https%3A%2F%2Fnot.app.envoy.com%2Fplatform%2Fslack%2Foauth2%2Fdefault%2Fcallback&scope=a%2Cb%2Cc&state=7'
      )
    })

    context('no redirect host is set', function () {
      beforeEach(function () {
        delete process.env.OAUTH_DEFAULT_REDIRECT_HOST
      })

      it('defaults to app.envoy.com', function () {
        $.subject()
        expect($.res.redirect).to.have.been.called()
        expect($.res.redirect.args[0][0]).to.include(`redirect_uri=${encodeURIComponent('https://app.envoy.com/')}`)
      })
    })
  })

  describe('callback', function () {
    def('params', () => ({
      ...$.params,
      code: 'somecode',
      state: '7'
    }))
    def('env', () => ({ OAUTH_DEFAULT_TEMP_TOKEN: '7' }))
    def('subject', () => () => $.oauth2.callback($.req, $.res))
    it('stores login info', async function () {
      await $.subject()
      expect($.res.meta).to.have.been.calledWith('set_env', {
        OAUTH_DEFAULT_ACCESS_TOKEN: 'at',
        OAUTH_DEFAULT_REFRESH_TOKEN: 'rt',
        OAUTH_DEFAULT_TEMP_TOKEN: null
      })
    })
    it('closes window', async function () {
      await $.subject()
      expect($.res.html).to.have.been.calledWith('<script>window.close()</script>')
    })

    context('invalid csfr token', function () {
      def('params', () => ({
        ...$.params,
        state: '8'
      }))
      it('fails', async function () {
        await $.subject()
        expect($.res.error).to.have.been.calledWith('invalid csrf token')
      })
    })

    context('authorization error', function () {
      def('params', () => ({
        ...$.params,
        error: 'someerror'
      }))
      it('fails', async function () {
        await $.subject()
        expect($.res.error).to.have.been.calledWith('authorization error someerror')
      })
    })
  })
})
