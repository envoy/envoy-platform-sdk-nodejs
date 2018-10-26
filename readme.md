# Envoy Platform NodeJS SDK

This plugin is setup to handle events, routing, and intercept synchronous flows from Envoy.

## Requirements
- `node >8`
- `envoy-plugin` - https://github.com/envoy/envoy-plugin-cli

## Setup

Get started by [following the instructions](https://github.com/envoy/https://github.com/envoy/envoy-plugin-cli) in the `https://github.com/envoy/envoy-plugin-cli` package. 

Run `npm install` to install the necessary packages.

Store local environment variables in `.env.local` and production environment variables `.env.production`. Do not commit these files.

## Writing Routes
First add your route to `envoy-manifest.json` and run `envoy sync` in order to let Envoy know about your new routes. The format of the route json should be as follows:

```js
{
  "method": "GET", // http method of route
  "path": "hello-world/:name", // rails style route pattern relative to /platform/your-plugin-name
  "handler": "hello-world" // name of route handler
}
```

Routes are forwarded from Envoy relative to the url `https://envoy.com/platform/your-plugin-name`. Use routes for serving up important data that might be used by your configuration setup or to provide UX unique to your plugin.

## Route Handlers
All route, event, and interception handlers look the same. Each handler is passed an instance of `Request` and `Response`.

```js
platform.route('hello-world', function(req, res){
  res.html("<b>Hello World!</b>");
});
```
### Request
- `req.event_id` — uuid for event (handler only, not available on route)
- `req.params` — url params or args
- `req.payload` — POST or JSON data
- `req.path` — full relative path of request (e.g. `hello-world/david`)
- `req.headers` — object of http headers whitelisted in manifest
- `req.user` — user object (optional)
- `req.location` — location object (see api docs)
- `req.company` — company object (see api docs)
- `req.config.user` — saved configuration data for the requesting user for this plugin
- `req.config.location` — saved configuration data for the requesting location for this plugin
- `req.config.company` — saved configuration data for the requesting company for this plugin
- `req.async` — boolean true or false

### Response

- `res.header('Content-Type', 'application/json');`
- `res.succeed();`
- `res.continue(event_id);`  — use for getting out of an intercepted flow and continuing with Envoy functionality
- `res.json({foo: true});`
- `res.html('<b>Hey World!</b>');`
- `res.raw('HELLO WORLD');`
- `res.file('./path/to/file');` — may not be viable on lambda
- `res.redirect('./relative-url');` — ./relative, /root, or http://google.com
- `res.error('text');` —
- `res.store('user|location|company', {foo:'bar'});` — saves data to key value store without requiring additional requests

## Async Event Handlers

You can trigger functionality on specific events. For example, if you want to respond to the `host_notification` event in certain conditions by turning on the fire sprinklers you could to this.

```js
// envoy-manifest.json
{
  // ... other configuration
  "events_handled" : {
    "host_notification": {
      "with": [] // use for requesting additional data not usually passed
    }
  }
}
```

```js
// index.json
// ... other logic
var myBuilding = require('my-building');
var shield = require('shield');
platform.handle('host_notification', function(req, res){
  if(req.payload.guest.name == 'Hulk') {
    myBuilding.activateFireSprinklers();
    myBuilding.evacuate();
    shield.request_assistance_from(['Iron Man', 'Thor']);
  }
  res.succeed();
})
```
## Synchronous Event Interceptors

You can trigger synchronous functionality on specific events. For example, if you want to display a document for signing before the check-in completes.

```js
// envoy-manifest.json
{
  // ... other configuration
  "routes": [
    {
      "path":"signature-callback/:event_id",
      "handler":"signature-callback"
    }
  ],
  "events_intercepted" : {
    "guest_signin": {
      "with": [] // use for requesting additional data not usually passed
    }
  }
}
```

```js
// index.json
// ... other logic
var docusign = require('docusign-api');

platform.intercept('guest_signin', function(req, res){
  docURL = docusign.getDocumentForSigning({callback: platform.link('signature-callback/'+req.event_id)});
  res.redirect(docUrl);
});

platform.route('signature-callback', function(req, res){
  if(req.payload.signed) {
    res.continue(req.params.event_id);
  } else {
    res.error("Unable to complete checkin. Invalid signature.");
  }
});
```

## Environment variables
| Environment variable name    | required for | note         |
|------------------------------|--------------|--------------|
| DEBUG                        | logger.*     | added by cli |
| ENVOY_BASE_URL               | this.event*  | added by cli |
| ENVOY_PLUGIN_KEY             | this.event*  | added by cli |
| E_TWILIO_SID                 | this.sms.*   |              |
| E_TWILIO_TOKEN               | this.sms.*   |              |
| E_TWILIO_NUMBER              | this.sms.*   |              |
| MANDRILL_API_KEY             | this.email.* |              |
| OAUTH_<app_id>_CLIENT_ID     | oauth config |              |
| OAUTH_<app_id>_CLIENT_SECRET | oauth config |              |
| OAUTH_<app_id>_AUTHORIZE_URL | oauth config |              |
| OAUTH_<app_id>_SITE          | oauth config |              |
| OAUTH_<app_id>_REDIRECT_HOST | oauth config |              |
| OAUTH_<app_id>_TOKEN_URL     | oauth config |              |
| OAUTH_<app_id>_SCOPE         | oauth config |              |
|------------------------------|--------------|--------------|
