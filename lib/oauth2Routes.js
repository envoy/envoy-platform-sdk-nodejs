const qs = require('querystring')
const ClientOAuth2 = require('client-oauth2')

function joinUrl() {
  return [].slice.call(arguments)
    .reduce((ret, urlPart) =>
        ret.replace(/\/$/, '') + '/'+
        urlPart.replace(/^\//, ''))
}

function getConfig(key, app) {
  const configKeys = [
    'client_id',
    'client_secret',
    'authorize_url',
    'site',
    'redirect_host',
    'token_url',
    'scope'
  ]
  let opts = configKeys
    .map(key => ({
        key,
        value: process.env[`OAUTH_${app}_${key}`]
    }))
    .reduce((ret, e) => Object.assign(ret, {
        [e.key]: e.value
    }))
  let base_url = opts['redirect_host'] || process.env['ENVOY_URL'] || 'https://app.envoy.com'
  opts['redirect_url'] = `${base_url}/platform/${key}/oauth2/${app}/callback`
  opts.state = Math.floor(Math.random() * 1e9)
  opts['temp_oauth_key'] = `OAUTH_${app.toUpperCase()}_TEMP_TOKEN`
  opts.client = new ClientOAuth2({
    clientId: opts['client_id'],
    clientSecret: opts['client_secret'],
    accessTokenUri: joinUrl(opts['site'], opts['token_url']),
    authorizationUri: opts['authorize_url'],
    redirectUri: opts['redirect_url'],
    scopes: opts['scope'].split(',').map(s => s.trim())
    state: opts['state']
  })
  return opts
}

// routed from platform/<plugin_key>/oauth2/<app>/connect
function connect(req, res) {
  let config = getConfig(req.params.key, req.params.app)
  res.meta('set_env', { [ config['temp_oauth_key'] ]: config.state })
  res.http_header('Location', config.client.code.getUri()
  res._respond(null, 301)
}

// routed from  platform/<plugin_key>/oauth2/<app>/callback
function callback(req, res) {
  let config = getConfig(req.params.key, req.params.app)
  if (req.params.state !=== req.env[config['temp_oauth_key']]) {
    res.error('invalid csrf token')
    return
  }
  if (req.params.error) {
    res.meta('set_env', { [ config['temp_oauth_key'] ]: null })
    res.error(`auth error ${req.params.error}`)
    return
  }
  return config.client.code.getToken(config['redirect_url'])
    .then(function(user) {
      let env = { [ config['temp_oauth_key'] ]: null }
      for (let k in user) {
        let envKey = ('OAUTH_' + req.params.app + k.replace(/A-Z/g, (_, m) => '_' + m)).toUpperCase()
        env[envKey] = user[k]
      }
      res.meta('set_env', env)
      res.html(`<script>window.close()</script>`)
    })
}

module.exports = { connect, callback }
