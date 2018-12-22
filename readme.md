# Envoy Platform NodeJS SDK

This plugin is setup to handle events and handling requests from Envoy.

## Requirements
- `node >8`
- `envoy-plugin` - https://github.com/envoy/envoy-plugin-cli

## Setup

Get started by [following the instructions](https://github.com/envoy/https://github.com/envoy/envoy-plugin-cli) in the `https://github.com/envoy/envoy-plugin-cli` package. 

Run `npm install` to install the necessary packages.

Store local environment variables in `.env.local` and production environment variables `.env.production`. Do not commit these files.

## Setting up the plugin configuration
...

## Using the SDK
>> [a Types Documentation](types.md)

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
| BUGSNAG_API_KEY              | bugsnag      |              |
