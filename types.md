## Classes

<dl>
<dt><a href="#Platform">Platform</a></dt>
<dd></dd>
<dt><a href="#Email">Email</a></dt>
<dd></dd>
<dt><a href="#Request">Request</a></dt>
<dd></dd>
<dt><a href="#Response">Response</a></dt>
<dd></dd>
<dt><a href="#Sms">Sms</a></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Platform">Platform</a> : <code>Object</code></dt>
<dd><p>Envoy platform instance for AWS lambda deployments</p>
</dd>
<dt><a href="#PlatformOptions">PlatformOptions</a></dt>
<dd></dd>
<dt><a href="#Email">Email</a> : <code>Object</code></dt>
<dd><p>Helper to send emails based on available metadata.</p>
</dd>
<dt><a href="#Request">Request</a> : <code>Object</code></dt>
<dd><p>Request object associated with a certain event</p>
</dd>
<dt><a href="#Response">Response</a> : <code>Object</code></dt>
<dd><p>Response helper, with methods to configure and return the plugin response</p>
<ul>
<li>note the methods can be called in both camel case and snake case for legacy support purposes</li>
</ul>
</dd>
<dt><a href="#JobAttachment">JobAttachment</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Sms">Sms</a> : <code>Object</code></dt>
<dd><p>Helper to send sms based on available metadata.</p>
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
| config | [<code>PlatformOptions</code>](#PlatformOptions) | Configuration object |

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
<a name="Email"></a>

## Email
**Kind**: global class  

* [Email](#Email)
    * [new Email(req)](#new_Email_new)
    * [.send(targetEmail, fromAlias, subject, messageText, messageHtml)](#Email+send)
    * [.sendToEntry(fromAlias, subject, messageText, messageHtml)](#Email+sendToEntry)

<a name="new_Email_new"></a>

### new Email(req)
Helper to send emails based on available metadata.


| Param | Type | Description |
| --- | --- | --- |
| req | [<code>Request</code>](#Request) | Request object to get metadata from |

<a name="Email+send"></a>

### email.send(targetEmail, fromAlias, subject, messageText, messageHtml)
Sends email

**Kind**: instance method of [<code>Email</code>](#Email)  

| Param | Type | Description |
| --- | --- | --- |
| targetEmail | <code>string</code> | Email address to send to |
| fromAlias | <code>string</code> | Alias to display in email client |
| subject | <code>string</code> | Email title |
| messageText | <code>string</code> | Text-only version of the message |
| messageHtml | <code>string</code> | Html version of the message |

**Example**  
```js
await this.email.send(
'john(a)doe.com',
'Envoy <> ISE integration',
'Greetings',
'Hello',
'<b>Hello</b>'
)
```
<a name="Email+sendToEntry"></a>

### email.sendToEntry(fromAlias, subject, messageText, messageHtml)
Sends email to visitor

**Kind**: instance method of [<code>Email</code>](#Email)  

| Param | Type | Description |
| --- | --- | --- |
| fromAlias | <code>string</code> | Alias to display in email client |
| subject | <code>string</code> | Email title |
| messageText | <code>string</code> | Text-only version of the message |
| messageHtml | <code>string</code> | Html version of the message |

**Example**  
```js
await this.email.sendToEntry(
'Envoy <> ISE integration',
'Greetings',
'Hello',
'<b>Hello</b>'
)
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

<a name="Response"></a>

## Response
**Kind**: global class  

* [Response](#Response)
    * [new Response(platform, context, loggingPrefix)](#new_Response_new)
    * [.jobUpdate(status, data)](#Response+jobUpdate)
    * [.jobIgnore(status, reason, data)](#Response+jobIgnore)
    * [.jobComplete(status, data)](#Response+jobComplete)
    * [.jobFail(status, data)](#Response+jobFail)
    * [.pluginFail(status, data)](#Response+pluginFail)
    * [.jobAttach(...attachments)](#Response+jobAttach)
    * [.succeed(data)](#Response+succeed)
    * [.raw(text, status)](#Response+raw)
    * [.json(data, status)](#Response+json)
    * [.view(path, status)](#Response+view)
    * [.html(html, status)](#Response+html)
    * [.redirect(url)](#Response+redirect)
    * [.error(error)](#Response+error)
    * [.httpHeader(header, value)](#Response+httpHeader)
    * [.meta(header, value)](#Response+meta)
    * [._respond()](#Response+_respond)

<a name="new_Response_new"></a>

### new Response(platform, context, loggingPrefix)
Response helper, with methods to configure and return the plugin response


| Param | Type | Description |
| --- | --- | --- |
| platform | [<code>Platform</code>](#Platform) | Envoy platform instance |
| context | <code>\*</code> | AWS Lambda context object |
| loggingPrefix | <code>string</code> | add a prefix to the response log lines) |

<a name="Response+jobUpdate"></a>

### response.jobUpdate(status, data)
Sets the job status to "in_progress" and updates status message.
The lambda function is completed only if the `data` parameter is given.
* works only if called in a job, or route with a job context

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| status | <code>string</code> |  | Status message |
| data | <code>\*</code> | <code></code> | Any detailed data object to assist debugging. |

**Example**  
```js
// from route
res.jobUpdate('Queued')
res.json({ 'something': 'for external use' })
// from worker
res.jobUpdate('Queued', { 'some': 'debug object' })
```
<a name="Response+jobIgnore"></a>

### response.jobIgnore(status, reason, data)
Sets the job status to "ignored" and updates status message.
The lambda function is completed only if the `data` parameter is given.
* works only if called in a job, or route with a job context

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | Status message |
| reason | <code>string</code> | Reason why the job is ignored |
| data | <code>\*</code> | Any detailed data object to assist debugging. |

**Example**  
```js
// from route
res.jobIgnore('Not sent', 'user_not_found')
res.json({ 'something': 'for external use' })

// from worker
res.jobIgnore('Not sent', 'user_not_found', { 'some': 'debug object' })
```
<a name="Response+jobComplete"></a>

### response.jobComplete(status, data)
Sets the job status to "done" and updates status message.
The lambda function is completed only if the `data` parameter is given.
* works only if called in a job, or route with a job context

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | Status message |
| data | <code>\*</code> | Any detailed data object to assist debugging. |

**Example**  
```js
// from route
res.jobComplete('Sent')
res.json({ 'something': 'for external use' })

// from worker
res.jobComplete('Sent', { 'some': 'debug object' })
```
<a name="Response+jobFail"></a>

### response.jobFail(status, data)
Sets the job status to "failed" and updates status message.
The lambda function is completed only if the `data` parameter is given.
* works only if called in a job, or route with a job context

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | Status message |
| data | <code>\*</code> | Any detailed data object to assist debugging. |

**Example**  
```js
// from route
res.jobFail('Queued')
res.json({ 'something': 'for external use' })

// from worker
res.jobFail('Queued', { 'some': 'debug object' })
```
<a name="Response+pluginFail"></a>

### response.pluginFail(status, data)
Sets the job status to "failed", updates status message and *disables* the plugin.
The behaviour is intended for cases where a plugin is in an unrecoverable state.
The lambda function is completed only if the `data` parameter is given.
* works only if called in a job, or route with a job context

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | Status message |
| data | <code>\*</code> | Any detailed data object to assist debugging. |

**Example**  
```js
// from route
res.pluginFail('Not sent', 'unauthorized')
res.json({ 'something': 'for external use' })

// from worker
res.pluginFail('Not sent', 'unauthorized', { 'some': 'debug object' })
```
<a name="Response+jobAttach"></a>

### response.jobAttach(...attachments)
Associates response attachments to a job. This information is visible to the user according to a given format.
* works only if called in a job, or route with a job context

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| ...attachments | [<code>JobAttachment</code>](#JobAttachment) | Attachments to associate with a job |

**Example**  
```js
res.jobAttach({
 type: 'link',
 label: 'NDA',
 value: 'https://somendaurl'
}, {
 type: 'password',
 label: 'WiFi password',
 value: '123'
})
```
<a name="Response+succeed"></a>

### response.succeed(data)
Returns a raw object to Envoy API.
Generally used for routes that validate installation flow

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>\*</code> | Object to send |

**Example**  
```js
function (req, res) {
 if (!req.body.mandatoryArgument) { return res.error('no') }
 res.succeed(req.body)
}
```
<a name="Response+raw"></a>

### response.raw(text, status)
Returns a raw text response.

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| text | <code>string</code> |  | text to return |
| status | <code>number</code> | <code></code> | http status code |

**Example**  
```js
res.raw('hello')
```
<a name="Response+json"></a>

### response.json(data, status)
Returns a json response.

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| data | <code>\*</code> |  | object to serialize |
| status | <code>number</code> | <code></code> | http status code |

**Example**  
```js
res.json({ ok: true })
```
<a name="Response+view"></a>

### response.view(path, status)
Returns a html response based on a view path.

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| path | <code>string</code> |  | relative path to _./views_ plugin folder |
| status | <code>number</code> | <code></code> | http status code |

**Example**  
```js
res.view({ ok: true })
```
<a name="Response+html"></a>

### response.html(html, status)
Returns a html response.

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| html | <code>string</code> | html code |
| status | <code>number</code> | http status code |

**Example**  
```js
res.html('<html></html>')
```
<a name="Response+redirect"></a>

### response.redirect(url)
Redirects to a different endpoint

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | url to redirect to |

**Example**  
```js
res.redirect('http://otherpage')
```
<a name="Response+error"></a>

### response.error(error)
Returns an error

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| error | <code>\*</code> | Error object. Doesn't necessarily have to be an _Error_ object. |

**Example**  
```js
res.error({ message: 'Not authorized' })
```
<a name="Response+httpHeader"></a>

### response.httpHeader(header, value)
Sets custom http headers

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| header | <code>string</code> | header to modify |
| value | <code>string</code> | header value to set |

**Example**  
```js
res.httpHeader('Content-Type', 'application/xml')
```
<a name="Response+meta"></a>

### response.meta(header, value)
Sets custom response meta to Envoy API

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| header | <code>string</code> | meta to modify |
| value | <code>\*</code> | value to set |

**Example**  
```js
res.meta('set_env', { 'TOKEN': 'some::token::value' })
```
<a name="Response+_respond"></a>

### response.\_respond()
DEPRECATED; DO NOT USE. Use specialized methods instead.

**Kind**: instance method of [<code>Response</code>](#Response)  
<a name="Sms"></a>

## Sms
**Kind**: global class  

* [Sms](#Sms)
    * [new Sms(req)](#new_Sms_new)
    * [.send(targetPhoneNumber, messageText)](#Sms+send)
    * [.sendToEntry(messageText)](#Sms+sendToEntry)
    * [.makeInternational(phoneNumber)](#Sms+makeInternational) ⇒ <code>string</code>
    * [.getEntryInternationalPhoneNumber()](#Sms+getEntryInternationalPhoneNumber) ⇒ <code>string</code>

<a name="new_Sms_new"></a>

### new Sms(req)
Helper to send sms based on available metadata.


| Param | Type | Description |
| --- | --- | --- |
| req | [<code>Request</code>](#Request) | Request object to get metadata from |

<a name="Sms+send"></a>

### sms.send(targetPhoneNumber, messageText)
Sends sms to a given phone number. Attempts to convert the
number to international format before sending to Twillio.

**Kind**: instance method of [<code>Sms</code>](#Sms)  

| Param | Type | Description |
| --- | --- | --- |
| targetPhoneNumber | <code>string</code> | Phone number to send the message to |
| messageText | <code>string</code> | Sms message |

<a name="Sms+sendToEntry"></a>

### sms.sendToEntry(messageText)
Sends an sms to the visitor's phone number

**Kind**: instance method of [<code>Sms</code>](#Sms)  

| Param | Type | Description |
| --- | --- | --- |
| messageText | <code>string</code> | Sms message |

<a name="Sms+makeInternational"></a>

### sms.makeInternational(phoneNumber) ⇒ <code>string</code>
Converts a phone number to international format based on available information.

**Kind**: instance method of [<code>Sms</code>](#Sms)  
**Returns**: <code>string</code> - Phone number in international format  

| Param | Type | Description |
| --- | --- | --- |
| phoneNumber | <code>string</code> | Phone number |

<a name="Sms+getEntryInternationalPhoneNumber"></a>

### sms.getEntryInternationalPhoneNumber() ⇒ <code>string</code>
Gets visitor's phone number in international format.

**Kind**: instance method of [<code>Sms</code>](#Sms)  
**Returns**: <code>string</code> - Phone number in international format  
<a name="Platform"></a>

## Platform : <code>Object</code>
Envoy platform instance for AWS lambda deployments

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| req | [<code>Request</code>](#Request) | Incoming request object |
| res | [<code>Response</code>](#Response) | Outgoing response object |
| sms | [<code>Sms</code>](#Sms) | Sms helper based on Twilio |
| email | [<code>Email</code>](#Email) | Email helper based on Mandrill |


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
| config | [<code>PlatformOptions</code>](#PlatformOptions) | Configuration object |

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
<a name="PlatformOptions"></a>

## PlatformOptions
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| baseDir | <code>string</code> | Base dir of the plugin |
| baseUrl | <code>string</code> | Base url of Envoy API |

<a name="Email"></a>

## Email : <code>Object</code>
Helper to send emails based on available metadata.

**Kind**: global typedef  

* [Email](#Email) : <code>Object</code>
    * [new Email(req)](#new_Email_new)
    * [.send(targetEmail, fromAlias, subject, messageText, messageHtml)](#Email+send)
    * [.sendToEntry(fromAlias, subject, messageText, messageHtml)](#Email+sendToEntry)

<a name="new_Email_new"></a>

### new Email(req)
Helper to send emails based on available metadata.


| Param | Type | Description |
| --- | --- | --- |
| req | [<code>Request</code>](#Request) | Request object to get metadata from |

<a name="Email+send"></a>

### email.send(targetEmail, fromAlias, subject, messageText, messageHtml)
Sends email

**Kind**: instance method of [<code>Email</code>](#Email)  

| Param | Type | Description |
| --- | --- | --- |
| targetEmail | <code>string</code> | Email address to send to |
| fromAlias | <code>string</code> | Alias to display in email client |
| subject | <code>string</code> | Email title |
| messageText | <code>string</code> | Text-only version of the message |
| messageHtml | <code>string</code> | Html version of the message |

**Example**  
```js
await this.email.send(
'john(a)doe.com',
'Envoy <> ISE integration',
'Greetings',
'Hello',
'<b>Hello</b>'
)
```
<a name="Email+sendToEntry"></a>

### email.sendToEntry(fromAlias, subject, messageText, messageHtml)
Sends email to visitor

**Kind**: instance method of [<code>Email</code>](#Email)  

| Param | Type | Description |
| --- | --- | --- |
| fromAlias | <code>string</code> | Alias to display in email client |
| subject | <code>string</code> | Email title |
| messageText | <code>string</code> | Text-only version of the message |
| messageHtml | <code>string</code> | Html version of the message |

**Example**  
```js
await this.email.sendToEntry(
'Envoy <> ISE integration',
'Greetings',
'Hello',
'<b>Hello</b>'
)
```
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

<a name="Response"></a>

## Response : <code>Object</code>
Response helper, with methods to configure and return the plugin response
* note the methods can be called in both camel case and snake case for legacy support purposes

**Kind**: global typedef  

* [Response](#Response) : <code>Object</code>
    * [new Response(platform, context, loggingPrefix)](#new_Response_new)
    * [.jobUpdate(status, data)](#Response+jobUpdate)
    * [.jobIgnore(status, reason, data)](#Response+jobIgnore)
    * [.jobComplete(status, data)](#Response+jobComplete)
    * [.jobFail(status, data)](#Response+jobFail)
    * [.pluginFail(status, data)](#Response+pluginFail)
    * [.jobAttach(...attachments)](#Response+jobAttach)
    * [.succeed(data)](#Response+succeed)
    * [.raw(text, status)](#Response+raw)
    * [.json(data, status)](#Response+json)
    * [.view(path, status)](#Response+view)
    * [.html(html, status)](#Response+html)
    * [.redirect(url)](#Response+redirect)
    * [.error(error)](#Response+error)
    * [.httpHeader(header, value)](#Response+httpHeader)
    * [.meta(header, value)](#Response+meta)
    * [._respond()](#Response+_respond)

<a name="new_Response_new"></a>

### new Response(platform, context, loggingPrefix)
Response helper, with methods to configure and return the plugin response


| Param | Type | Description |
| --- | --- | --- |
| platform | [<code>Platform</code>](#Platform) | Envoy platform instance |
| context | <code>\*</code> | AWS Lambda context object |
| loggingPrefix | <code>string</code> | add a prefix to the response log lines) |

<a name="Response+jobUpdate"></a>

### response.jobUpdate(status, data)
Sets the job status to "in_progress" and updates status message.
The lambda function is completed only if the `data` parameter is given.
* works only if called in a job, or route with a job context

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| status | <code>string</code> |  | Status message |
| data | <code>\*</code> | <code></code> | Any detailed data object to assist debugging. |

**Example**  
```js
// from route
res.jobUpdate('Queued')
res.json({ 'something': 'for external use' })
// from worker
res.jobUpdate('Queued', { 'some': 'debug object' })
```
<a name="Response+jobIgnore"></a>

### response.jobIgnore(status, reason, data)
Sets the job status to "ignored" and updates status message.
The lambda function is completed only if the `data` parameter is given.
* works only if called in a job, or route with a job context

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | Status message |
| reason | <code>string</code> | Reason why the job is ignored |
| data | <code>\*</code> | Any detailed data object to assist debugging. |

**Example**  
```js
// from route
res.jobIgnore('Not sent', 'user_not_found')
res.json({ 'something': 'for external use' })

// from worker
res.jobIgnore('Not sent', 'user_not_found', { 'some': 'debug object' })
```
<a name="Response+jobComplete"></a>

### response.jobComplete(status, data)
Sets the job status to "done" and updates status message.
The lambda function is completed only if the `data` parameter is given.
* works only if called in a job, or route with a job context

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | Status message |
| data | <code>\*</code> | Any detailed data object to assist debugging. |

**Example**  
```js
// from route
res.jobComplete('Sent')
res.json({ 'something': 'for external use' })

// from worker
res.jobComplete('Sent', { 'some': 'debug object' })
```
<a name="Response+jobFail"></a>

### response.jobFail(status, data)
Sets the job status to "failed" and updates status message.
The lambda function is completed only if the `data` parameter is given.
* works only if called in a job, or route with a job context

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | Status message |
| data | <code>\*</code> | Any detailed data object to assist debugging. |

**Example**  
```js
// from route
res.jobFail('Queued')
res.json({ 'something': 'for external use' })

// from worker
res.jobFail('Queued', { 'some': 'debug object' })
```
<a name="Response+pluginFail"></a>

### response.pluginFail(status, data)
Sets the job status to "failed", updates status message and *disables* the plugin.
The behaviour is intended for cases where a plugin is in an unrecoverable state.
The lambda function is completed only if the `data` parameter is given.
* works only if called in a job, or route with a job context

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | Status message |
| data | <code>\*</code> | Any detailed data object to assist debugging. |

**Example**  
```js
// from route
res.pluginFail('Not sent', 'unauthorized')
res.json({ 'something': 'for external use' })

// from worker
res.pluginFail('Not sent', 'unauthorized', { 'some': 'debug object' })
```
<a name="Response+jobAttach"></a>

### response.jobAttach(...attachments)
Associates response attachments to a job. This information is visible to the user according to a given format.
* works only if called in a job, or route with a job context

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| ...attachments | [<code>JobAttachment</code>](#JobAttachment) | Attachments to associate with a job |

**Example**  
```js
res.jobAttach({
 type: 'link',
 label: 'NDA',
 value: 'https://somendaurl'
}, {
 type: 'password',
 label: 'WiFi password',
 value: '123'
})
```
<a name="Response+succeed"></a>

### response.succeed(data)
Returns a raw object to Envoy API.
Generally used for routes that validate installation flow

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>\*</code> | Object to send |

**Example**  
```js
function (req, res) {
 if (!req.body.mandatoryArgument) { return res.error('no') }
 res.succeed(req.body)
}
```
<a name="Response+raw"></a>

### response.raw(text, status)
Returns a raw text response.

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| text | <code>string</code> |  | text to return |
| status | <code>number</code> | <code></code> | http status code |

**Example**  
```js
res.raw('hello')
```
<a name="Response+json"></a>

### response.json(data, status)
Returns a json response.

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| data | <code>\*</code> |  | object to serialize |
| status | <code>number</code> | <code></code> | http status code |

**Example**  
```js
res.json({ ok: true })
```
<a name="Response+view"></a>

### response.view(path, status)
Returns a html response based on a view path.

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| path | <code>string</code> |  | relative path to _./views_ plugin folder |
| status | <code>number</code> | <code></code> | http status code |

**Example**  
```js
res.view({ ok: true })
```
<a name="Response+html"></a>

### response.html(html, status)
Returns a html response.

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| html | <code>string</code> | html code |
| status | <code>number</code> | http status code |

**Example**  
```js
res.html('<html></html>')
```
<a name="Response+redirect"></a>

### response.redirect(url)
Redirects to a different endpoint

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | url to redirect to |

**Example**  
```js
res.redirect('http://otherpage')
```
<a name="Response+error"></a>

### response.error(error)
Returns an error

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| error | <code>\*</code> | Error object. Doesn't necessarily have to be an _Error_ object. |

**Example**  
```js
res.error({ message: 'Not authorized' })
```
<a name="Response+httpHeader"></a>

### response.httpHeader(header, value)
Sets custom http headers

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| header | <code>string</code> | header to modify |
| value | <code>string</code> | header value to set |

**Example**  
```js
res.httpHeader('Content-Type', 'application/xml')
```
<a name="Response+meta"></a>

### response.meta(header, value)
Sets custom response meta to Envoy API

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| header | <code>string</code> | meta to modify |
| value | <code>\*</code> | value to set |

**Example**  
```js
res.meta('set_env', { 'TOKEN': 'some::token::value' })
```
<a name="Response+_respond"></a>

### response.\_respond()
DEPRECATED; DO NOT USE. Use specialized methods instead.

**Kind**: instance method of [<code>Response</code>](#Response)  
<a name="JobAttachment"></a>

## JobAttachment : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| type | <code>&quot;username&quot;</code> \| <code>&quot;password&quot;</code> \| <code>&quot;link&quot;</code> | Attachment type |
| label | <code>string</code> | Label to show in the interface |
| value | <code>string</code> | Associated value |

<a name="Sms"></a>

## Sms : <code>Object</code>
Helper to send sms based on available metadata.

**Kind**: global typedef  

* [Sms](#Sms) : <code>Object</code>
    * [new Sms(req)](#new_Sms_new)
    * [.send(targetPhoneNumber, messageText)](#Sms+send)
    * [.sendToEntry(messageText)](#Sms+sendToEntry)
    * [.makeInternational(phoneNumber)](#Sms+makeInternational) ⇒ <code>string</code>
    * [.getEntryInternationalPhoneNumber()](#Sms+getEntryInternationalPhoneNumber) ⇒ <code>string</code>

<a name="new_Sms_new"></a>

### new Sms(req)
Helper to send sms based on available metadata.


| Param | Type | Description |
| --- | --- | --- |
| req | [<code>Request</code>](#Request) | Request object to get metadata from |

<a name="Sms+send"></a>

### sms.send(targetPhoneNumber, messageText)
Sends sms to a given phone number. Attempts to convert the
number to international format before sending to Twillio.

**Kind**: instance method of [<code>Sms</code>](#Sms)  

| Param | Type | Description |
| --- | --- | --- |
| targetPhoneNumber | <code>string</code> | Phone number to send the message to |
| messageText | <code>string</code> | Sms message |

<a name="Sms+sendToEntry"></a>

### sms.sendToEntry(messageText)
Sends an sms to the visitor's phone number

**Kind**: instance method of [<code>Sms</code>](#Sms)  

| Param | Type | Description |
| --- | --- | --- |
| messageText | <code>string</code> | Sms message |

<a name="Sms+makeInternational"></a>

### sms.makeInternational(phoneNumber) ⇒ <code>string</code>
Converts a phone number to international format based on available information.

**Kind**: instance method of [<code>Sms</code>](#Sms)  
**Returns**: <code>string</code> - Phone number in international format  

| Param | Type | Description |
| --- | --- | --- |
| phoneNumber | <code>string</code> | Phone number |

<a name="Sms+getEntryInternationalPhoneNumber"></a>

### sms.getEntryInternationalPhoneNumber() ⇒ <code>string</code>
Gets visitor's phone number in international format.

**Kind**: instance method of [<code>Sms</code>](#Sms)  
**Returns**: <code>string</code> - Phone number in international format  
