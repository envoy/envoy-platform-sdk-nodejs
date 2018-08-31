const oauth2 = require('simple-oauth2')

function getConfig (key, app) {
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
      value: process.env[`OAUTH_${app}_${key}`.toUpperCase()]
    }))
    .reduce((ret, e) =>
      Object.assign(ret, { [e.key]: e.value }), {})
  let baseUrl = opts['redirect_host'] || process.env['ENVOY_URL'] || 'https://app.envoy.com'
  opts['redirect_url'] = `${baseUrl}/platform/${key}/oauth2/${app}/callback`
  opts.state = Math.floor(Math.random() * 1e9).toString()
  opts['temp_oauth_key'] = `OAUTH_${app.toUpperCase()}_TEMP_TOKEN`
  opts.client = oauth2.create({
    client: {
      id: opts['client_id'],
      secret: opts['client_secret']
    },
    auth: {
      tokenHost: opts['site'],
      tokenPath: opts['token_url'],
      authorizeHost: opts['authorize_url'],
      authorizePath: opts['authorize_url']
    }
  })
  opts['authorize_url'] = opts.client.authorizationCode.authorizeURL({
    redirect_uri: opts['redirect_url'],
    scope: opts['scope'].split(',').map(s => s.trim()),
    state: opts['state']
  })
  return opts
}

// routed from platform/<plugin_key>/oauth/connect?app=<app_key>
function connect (req, res) {
  let config = getConfig(req.params.key, req.params.app)
  res.meta('set_env', { [ config['temp_oauth_key'] ]: config.state })
  res.redirect(config['authorize_url'])
}

// routed from  platform/<plugin_key>/oauth/callback?app=<app_key>
async function callback (req, res) {
  const config = getConfig(req.params.key, req.params.app)
  if (req.params.state !== req.env[config['temp_oauth_key']]) {
    res.error('invalid csrf token')
    return
  }
  if (req.params.error) {
    res.meta('set_env', { [ config['temp_oauth_key'] ]: null })
    res.error(`authorization error ${req.params.error}`)
    return
  }
  const user = await config.client.authorizationCode.getToken({
    redirect_uri: config['redirect_url'],
    code: req.params.code
  })
  let env = { [ config['temp_oauth_key'] ]: null }
  for (let k in user) {
    let envKey = [ 'OAUTH', req.params.app, k.replace(/[A-Z]/g, m => '_' + m) ]
      .join('_').toUpperCase()
    env[envKey] = user[k]
  }
  res.meta('set_env', env)
  res.html(`<script>window.close()</script>`)
}

module.exports = { connect, callback }
