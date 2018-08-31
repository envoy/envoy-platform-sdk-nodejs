const nock = require('nock')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const chai = require('chai')
const dirtyChai = require('dirty-chai')
const sinonChai = require('sinon-chai')
chai.use(dirtyChai)
chai.use(sinonChai)
const expect = chai.expect

describe('oauth2Routes', function () {
  beforeEach(function () {
    this.randomStub = sinon.stub(Math, 'random')
    this.randomStub.returns(0)
    Object.assign(process.env, {
      OAUTH_DEFAULT_CLIENT_ID: 'clientid',
      OAUTH_DEFAULT_CLIENT_SECRET: 'clientsecret',
      OAUTH_DEFAULT_SITE: 'https://site',
      OAUTH_DEFAULT_TOKEN_URL: '/token',
      OAUTH_DEFAULT_AUTHORIZE_URL: 'https://site/authorize',
      OAUTH_DEFAULT_REDIRECT_HOST: 'https://not.app.envoy.com',
      OAUTH_DEFAULT_SCOPE: 'a, b, c'
    })
  })
  afterEach(function () {
    this.randomStub.restore()
    nock.cleanAll()
  })
  describe('connect', function () {
    it('should redirect to authorization url', function () {
      let oauth2 = proxyquire('../lib/oauth2Routes', {})
      let req = {
        params: {
          app: 'default',
          key: 'slack'
        }
      }
      let res = {
        meta: sinon.spy(),
        redirect: sinon.spy()
      }
      oauth2.connect(req, res)
      expect(res.meta).to.have.been.calledWith('set_env', {
        OAUTH_DEFAULT_TEMP_TOKEN: '0'
      })
      expect(res.redirect).to.have.been.calledWith(
        'https://site/authorize?response_type=code&client_id=clientid&redirect_uri=https%3A%2F%2Fnot.app.envoy.com%2Fplatform%2Fslack%2Foauth2%2Fdefault%2Fcallback&scope=a%2Cb%2Cc&state=0'
      )
    })
  })
  describe('callback', function () {
    it('should save login information and close the auth window', function (done) {
      let oauth2 = proxyquire('../lib/oauth2Routes', {})
      let req = {
        env: {
          OAUTH_DEFAULT_TEMP_TOKEN: '0'
        },
        params: {
          app: 'default',
          key: 'slack',
          code: 'somecode',
          state: '0'
        }
      }
      let res = {
        meta: sinon.spy(),
        html: sinon.spy(),
        error: sinon.spy()
      }
      nock('https://site')
        .post('/token', 'redirect_uri=https%3A%2F%2Fnot.app.envoy.com%2Fplatform%2Fslack%2Foauth2%2Fdefault%2Fcallback&code=somecode&grant_type=authorization_code&client_id=clientid&client_secret=clientsecret')
        .reply(200, JSON.stringify({
          accessToken: 'at',
          refreshToken: 'rt'
        }))

      oauth2.callback(req, res)
        .then(() => {
          expect(res.error).to.not.have.been.called()
          expect(res.meta).to.have.been.calledWith('set_env', {
            OAUTH_DEFAULT_ACCESS_TOKEN: 'at',
            OAUTH_DEFAULT_REFRESH_TOKEN: 'rt',
            OAUTH_DEFAULT_TEMP_TOKEN: null
          })
          done()
        })
        .catch(done)
    })
    it('should fail on invalid csfr token', function () {
      let oauth2 = proxyquire('../lib/oauth2Routes', {})
      let req = {
        env: {
          OAUTH_DEFAULT_TEMP_TOKEN: '0'
        },
        params: {
          app: 'default',
          key: 'slack',
          code: 'somecode',
          state: '10'
        }
      }
      let res = {
        meta: sinon.spy(),
        html: sinon.spy(),
        error: sinon.spy()
      }
      oauth2.callback(req, res)
      expect(res.error).to.have.been.calledWith('invalid csrf token')
    })
    it('return error in case of authorization error', function () {
      let oauth2 = proxyquire('../lib/oauth2Routes', {})
      let req = {
        env: {
          OAUTH_DEFAULT_TEMP_TOKEN: '0'
        },
        params: {
          app: 'default',
          key: 'slack',
          error: 'someerror',
          state: '0'
        }
      }
      let res = {
        meta: sinon.spy(),
        html: sinon.spy(),
        error: sinon.spy()
      }
      oauth2.callback(req, res)
      expect(res.error).to.have.been.calledWith('authorization error someerror')
    })
  })
})
