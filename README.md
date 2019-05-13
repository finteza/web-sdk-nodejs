# Finteza Node.JS SDK

The official sdk for sending events to Finteza servers and proxying analytical requests via the website.

Also worked with TypeScript.

## Requirement

- Node.JS 8+

## Installation

Use the [NPM](https://www.npmjs.com/) package manager to install SDK easily.

Run the following command from the console:

```
npm i --save finteza-sdk
```

## Usage

### Sending events

Use the `sendEvent` function to send events to Finteza

Inputs:

| Parameter    | Type   | Description                                                                                                             |
| ------------ | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| name \*      | string | Event name. The maximum length is 128 symbols.                                                                          |
| websiteId \* | string | Website ID. It can be obtained in the website settings (`ID` field) of the [Finteza panel](https://panel.finteza.com/). |
| url          | string | Optional. Finteza server address.                                                                                       |
| referer      | string | Optional. Host of a website SDK is called on.                                                                           |
| value        | number | Optional. Additional parameter value.                                                                                   |
| unit         | string | Optional. Additional parameter measurement units, for example, USD, items, etc. The maximum length is 32 symbols.       |

Example:

```js
const finteza = require("finteza-sdk");

// sending event
finteza.sendEvent({
  name: "Server Track Test",
  websiteId: "sbnonjcmrvdebluwjzylmbhfkrmiabtqpc"
});
```

See [Finteza help](https://www.finteza.com/en/developer/php-sdk/php-sdk-events) for more details on sending events.

### Proxying analytical requests

Use the `createProxyMiddleware` function to create middleware for proxy all analytical requests to Finteza

Inputs:

| Parameter | Type   | Description                                                                                                                                                     |
| --------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| path \*   | string | Start of the path for requests to be proxied.                                                                                                                   |
| token \*  | string | Token for signing the `X-Forwarder-For header`. You can get this value in the website settings (`ID` field) of the [Finteza panel](https://panel.finteza.com/). |
| url       | string | Optional. Finteza server address.                                                                                                                               |
| timeout   | number | Optional. Timeout for proxy requests. Default: `15000` ms                                                                                                       |

Example:

```js
const path = require("path");
const express = require("express");
const finteza = require("finteza-sdk");

const app = express();

app.use(
  finteza.createProxyMiddleware({
    token: "dahhihvyvtjgsbdrdahhihvyvtjgsbdr",
    path: "/fz/"
  })
);

// ...

app.listen(8080);
```

This middleware sorts out incoming requests on its own and proxies only analytical requests to the Finteza servers.

Also, Finteza counter code installed on the website should be changed for correct operation.

See [Finteza help](https://www.finteza.com/en/developer/insert-code/proxy-script-request) for more details on configuring proxying.

## License

Released under the [BSD License](https://opensource.org/licenses/BSD-3-Clause).
