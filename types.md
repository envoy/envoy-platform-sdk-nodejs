## Classes

<dl>
<dt><a href="#Platform">Platform</a></dt>
<dd></dd>
<dt><a href="#Request">Request</a></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Platform">Platform</a> : <code>Object</code></dt>
<dd><p>Envoy platform instance for AWS lambda deployments</p>
</dd>
<dt><a href="#PlatformOpts">PlatformOpts</a></dt>
<dd></dd>
<dt><a href="#Request">Request</a> : <code>Object</code></dt>
<dd><p>Request object associated with a certain event</p>
</dd>
</dl>

<a name="Platform"></a>

## Platform
**Kind**: global class  

* [Platform](#Platform)
    * [new Platform(config)](#new_Platform_new)
    * [.registerRoute(name, fn)](#Platform+registerRoute)
    * [.registerWorker(name, fn)](#Platform+registerWorker)
    * [.getJobLink(path, queryParams)](#Platform+getJobLink)
    * [.getEventReportLink(path, queryParams)](#Platform+getEventReportLink)
    * [.getRouteLink(path, queryParams)](#Platform+getRouteLink)
    * [.eventUpdate(statusSummary, eventStatus, failureReason)](#Platform+eventUpdate)
    * [.eventComplete(statusSummary)](#Platform+eventComplete)
    * [.eventIgnore(statusSummary, failureReason)](#Platform+eventIgnore)
    * [.eventFail(statusSummary, failureReason)](#Platform+eventFail)
    * [.getHandler()](#Platform+getHandler)

<a name="new_Platform_new"></a>

### new Platform(config)
Envoy platform instance for AWS lambda deployments


| Param | Type | Description |
| --- | --- | --- |
| config | [<code>PlatformOpts</code>](#PlatformOpts) | Configuration object |

**Example**  
```js
const platform = new Platform({ baseDir: __dirname })
```
<a name="Platform+registerRoute"></a>

### platform.registerRoute(name, fn)
Registers a route handler for a given path

**Kind**: instance method of [<code>Platform</code>](#Platform)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | url path of the route apearing after /platform/{pluginKey}/ |
| fn | <code>function</code> | function to handle the request type |

**Example**  
```js
platform.registerRoute('party/welcome', function (req, res) { res.json({ ok: true }) })
```
<a name="Platform+registerWorker"></a>

### platform.registerWorker(name, fn)
Registers a worker handler for a given worker name

**Kind**: instance method of [<code>Platform</code>](#Platform)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | name of the worker |
| fn | <code>function</code> | function to handle the worker |

**Example**  
```js
platform.registerWorker('nda', function (req, res) { res.job_complete('Uploaded', {}) })
```
<a name="Platform+getJobLink"></a>

### platform.getJobLink(path, queryParams)
Gets a complete url to a route of the plugin. Forwards job context.

**Kind**: instance method of [<code>Platform</code>](#Platform)  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | relative path of the endpoint |
| queryParams | <code>Object.&lt;string, string&gt;</code> | query parameters to append |

**Example**  
```js
function (req, res) { res.redirect(this.getEventReportLink('/auth')) }
```
<a name="Platform+getEventReportLink"></a>

### platform.getEventReportLink(path, queryParams)
Gets a complete url to a route of the plugin. Forwards event report id.

**Kind**: instance method of [<code>Platform</code>](#Platform)  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | relative path of the endpoint |
| queryParams | <code>Object.&lt;string, string&gt;</code> | query parameters to append |

**Example**  
```js
function (req, res) { res.redirect(this.getEventReportLink('/auth')) }
```
<a name="Platform+getRouteLink"></a>

### platform.getRouteLink(path, queryParams)
Gets a complete url to a route of the plugin

**Kind**: instance method of [<code>Platform</code>](#Platform)  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | relative path of the endpoint |
| queryParams | <code>Object.&lt;string, string&gt;</code> | query parameters to append |

**Example**  
```js
function (req, res) { res.redirect(this.getRouteLink('/auth')) }
```
<a name="Platform+eventUpdate"></a>

### platform.eventUpdate(statusSummary, eventStatus, failureReason)
Updates hub event report

**Kind**: instance method of [<code>Platform</code>](#Platform)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| statusSummary | <code>string</code> |  | readable description of the status |
| eventStatus | <code>&quot;in\_progress&quot;</code> \| <code>&quot;done&quot;</code> \| <code>&quot;failed&quot;</code> \| <code>&quot;ignored&quot;</code> | <code>in_progress</code> | status in database format |
| failureReason | <code>string</code> | <code>null</code> | readable description of why the job failed |

**Example**  
```js
this.eventUpdate('queued') // keeps database status as in_progress
```
<a name="Platform+eventComplete"></a>

### platform.eventComplete(statusSummary)
Updates hub event report as complete

**Kind**: instance method of [<code>Platform</code>](#Platform)  

| Param | Type | Description |
| --- | --- | --- |
| statusSummary | <code>string</code> | readable description of the status |

**Example**  
```js
this.eventComplete('Sent')
```
<a name="Platform+eventIgnore"></a>

### platform.eventIgnore(statusSummary, failureReason)
Updates hub event report as ignored

**Kind**: instance method of [<code>Platform</code>](#Platform)  

| Param | Type | Description |
| --- | --- | --- |
| statusSummary | <code>string</code> | readable description of the status |
| failureReason | <code>string</code> | reason why it was ignored |

**Example**  
```js
this.eventIgnored('Not sent', "user_not_found")
```
<a name="Platform+eventFail"></a>

### platform.eventFail(statusSummary, failureReason)
Updates hub event report as failed

**Kind**: instance method of [<code>Platform</code>](#Platform)  

| Param | Type | Description |
| --- | --- | --- |
| statusSummary | <code>string</code> | readable description of the status |
| failureReason | <code>string</code> | reason why it failed |

**Example**  
```js
this.eventIgnored('Not sent', "API Error")
```
<a name="Platform+getHandler"></a>

### platform.getHandler()
Gets AWS Lambda compatible handler

**Kind**: instance method of [<code>Platform</code>](#Platform)  
**Example**  
```js
const EnvoyPlatform = require('envoy-platform-sdk')
const platformInstance = new EnvoyPlatform()
exports.handler = platformInstance.getHandler()
```
<a name="Request"></a>

## Request
**Kind**: global class  
<a name="new_Request_new"></a>

### new Request(platform, src, context)
Request object associated with a certain event


| Param | Type | Description |
| --- | --- | --- |
| platform | [<code>Platform</code>](#Platform) | Envoy Platform object that handles the event |
| src | <code>\*</code> | AWS Lambda event object |
| context | <code>\*</code> | AWS Lambda context object |

<a name="Platform"></a>

## Platform : <code>Object</code>
Envoy platform instance for AWS lambda deployments

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| req | [<code>Request</code>](#Request) | Incoming request object |
| res | <code>Response</code> | Outgoing response object |
| sms | <code>Sms</code> | Sms helper based on Twilio |
| email | <code>Email</code> | Email helper based on Mandrill |


* [Platform](#Platform) : <code>Object</code>
    * [new Platform(config)](#new_Platform_new)
    * [.registerRoute(name, fn)](#Platform+registerRoute)
    * [.registerWorker(name, fn)](#Platform+registerWorker)
    * [.getJobLink(path, queryParams)](#Platform+getJobLink)
    * [.getEventReportLink(path, queryParams)](#Platform+getEventReportLink)
    * [.getRouteLink(path, queryParams)](#Platform+getRouteLink)
    * [.eventUpdate(statusSummary, eventStatus, failureReason)](#Platform+eventUpdate)
    * [.eventComplete(statusSummary)](#Platform+eventComplete)
    * [.eventIgnore(statusSummary, failureReason)](#Platform+eventIgnore)
    * [.eventFail(statusSummary, failureReason)](#Platform+eventFail)
    * [.getHandler()](#Platform+getHandler)

<a name="new_Platform_new"></a>

### new Platform(config)
Envoy platform instance for AWS lambda deployments


| Param | Type | Description |
| --- | --- | --- |
| config | [<code>PlatformOpts</code>](#PlatformOpts) | Configuration object |

**Example**  
```js
const platform = new Platform({ baseDir: __dirname })
```
<a name="Platform+registerRoute"></a>

### platform.registerRoute(name, fn)
Registers a route handler for a given path

**Kind**: instance method of [<code>Platform</code>](#Platform)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | url path of the route apearing after /platform/{pluginKey}/ |
| fn | <code>function</code> | function to handle the request type |

**Example**  
```js
platform.registerRoute('party/welcome', function (req, res) { res.json({ ok: true }) })
```
<a name="Platform+registerWorker"></a>

### platform.registerWorker(name, fn)
Registers a worker handler for a given worker name

**Kind**: instance method of [<code>Platform</code>](#Platform)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | name of the worker |
| fn | <code>function</code> | function to handle the worker |

**Example**  
```js
platform.registerWorker('nda', function (req, res) { res.job_complete('Uploaded', {}) })
```
<a name="Platform+getJobLink"></a>

### platform.getJobLink(path, queryParams)
Gets a complete url to a route of the plugin. Forwards job context.

**Kind**: instance method of [<code>Platform</code>](#Platform)  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | relative path of the endpoint |
| queryParams | <code>Object.&lt;string, string&gt;</code> | query parameters to append |

**Example**  
```js
function (req, res) { res.redirect(this.getEventReportLink('/auth')) }
```
<a name="Platform+getEventReportLink"></a>

### platform.getEventReportLink(path, queryParams)
Gets a complete url to a route of the plugin. Forwards event report id.

**Kind**: instance method of [<code>Platform</code>](#Platform)  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | relative path of the endpoint |
| queryParams | <code>Object.&lt;string, string&gt;</code> | query parameters to append |

**Example**  
```js
function (req, res) { res.redirect(this.getEventReportLink('/auth')) }
```
<a name="Platform+getRouteLink"></a>

### platform.getRouteLink(path, queryParams)
Gets a complete url to a route of the plugin

**Kind**: instance method of [<code>Platform</code>](#Platform)  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | relative path of the endpoint |
| queryParams | <code>Object.&lt;string, string&gt;</code> | query parameters to append |

**Example**  
```js
function (req, res) { res.redirect(this.getRouteLink('/auth')) }
```
<a name="Platform+eventUpdate"></a>

### platform.eventUpdate(statusSummary, eventStatus, failureReason)
Updates hub event report

**Kind**: instance method of [<code>Platform</code>](#Platform)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| statusSummary | <code>string</code> |  | readable description of the status |
| eventStatus | <code>&quot;in\_progress&quot;</code> \| <code>&quot;done&quot;</code> \| <code>&quot;failed&quot;</code> \| <code>&quot;ignored&quot;</code> | <code>in_progress</code> | status in database format |
| failureReason | <code>string</code> | <code>null</code> | readable description of why the job failed |

**Example**  
```js
this.eventUpdate('queued') // keeps database status as in_progress
```
<a name="Platform+eventComplete"></a>

### platform.eventComplete(statusSummary)
Updates hub event report as complete

**Kind**: instance method of [<code>Platform</code>](#Platform)  

| Param | Type | Description |
| --- | --- | --- |
| statusSummary | <code>string</code> | readable description of the status |

**Example**  
```js
this.eventComplete('Sent')
```
<a name="Platform+eventIgnore"></a>

### platform.eventIgnore(statusSummary, failureReason)
Updates hub event report as ignored

**Kind**: instance method of [<code>Platform</code>](#Platform)  

| Param | Type | Description |
| --- | --- | --- |
| statusSummary | <code>string</code> | readable description of the status |
| failureReason | <code>string</code> | reason why it was ignored |

**Example**  
```js
this.eventIgnored('Not sent', "user_not_found")
```
<a name="Platform+eventFail"></a>

### platform.eventFail(statusSummary, failureReason)
Updates hub event report as failed

**Kind**: instance method of [<code>Platform</code>](#Platform)  

| Param | Type | Description |
| --- | --- | --- |
| statusSummary | <code>string</code> | readable description of the status |
| failureReason | <code>string</code> | reason why it failed |

**Example**  
```js
this.eventIgnored('Not sent', "API Error")
```
<a name="Platform+getHandler"></a>

### platform.getHandler()
Gets AWS Lambda compatible handler

**Kind**: instance method of [<code>Platform</code>](#Platform)  
**Example**  
```js
const EnvoyPlatform = require('envoy-platform-sdk')
const platformInstance = new EnvoyPlatform()
exports.handler = platformInstance.getHandler()
```
<a name="PlatformOpts"></a>

## PlatformOpts
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| baseDir | <code>string</code> | Base dir of the plugin |
| baseUrl | <code>string</code> | Base url of Envoy API |

<a name="Request"></a>

## Request : <code>Object</code>
Request object associated with a certain event

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| install | <code>\*</code> | Install metadata todo: add expected server side request_meta properties |

<a name="new_Request_new"></a>

### new Request(platform, src, context)
Request object associated with a certain event


| Param | Type | Description |
| --- | --- | --- |
| platform | [<code>Platform</code>](#Platform) | Envoy Platform object that handles the event |
| src | <code>\*</code> | AWS Lambda event object |
| context | <code>\*</code> | AWS Lambda context object |

