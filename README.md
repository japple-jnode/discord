# `@jnode/discord`

Simple Discord API package for Node.js.

**Note:** This package requires Node.js **v22.4.0** or later to use the built-in `WebSocket` for Discord gateway connections.

## Installation

```
npm i @jnode/discord
```

## Quick start

### Import

```js
const { Client, Attachment } = require('@jnode/discord');
```

### Start a simple "Ping-Pong" bot

```js
const client = new Client('YOUR_BOT_TOKEN');

// Initialize the gateway to receive events
const gateway = client.gateway({
  intents: 3276799 // All intents (ensure they are enabled in dev portal)
});

// Listen for message events
gateway.on('MESSAGE_CREATE', async (message) => {
  if (message.content === '!ping') {
    // Send a reply using the REST client
    await client.request('POST', `/channels/${message.channel_id}/messages`, {
      content: 'Pong!'
    });
  }
});
```

### Sending files (Attachments)

```js
const fs = require('fs');

async function sendImage(channelId) {
  const fileData = fs.readFileSync('./image.png');
  const image = new Attachment('image.png', 'image/png', fileData);

  await client.request('POST', `/channels/${channelId}/messages`, 
    { content: 'Here is your image!' },
    [image] // Pass attachments as an array
  );
}
```

## How it works?

`@jnode/discord` provides a lightweight wrapper around the Discord REST API and WebSocket Gateway.

1. **REST Client (`Client`)**: Handles all HTTP requests to Discord (messages, channel management, etc.). It includes built-in support for rate-limit auto-retries and multipart/form-data for file uploads.
2. **Gateway (`Gateway`)**: An `EventEmitter` that maintains a WebSocket connection to Discord. it handles heartbeats, identifies your bot, and emits events when things happen on Discord (like a new message or a member joining).

We keep it simple: no heavy abstractions, just the tools you need to interact with the API directly.

------

# Reference

## Class: `discord.Client`

The main controller for interacting with the Discord REST API.

### `new discord.Client(token[, options])`

- `token` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) Your Discord Bot token.
- `options` [\<Object\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)
  - `baseUrl` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) The API root. **Default:** `'https://discord.com/api/v10'`.
  - `autoRetry` [\<boolean\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#boolean_type) Whether to automatically wait and retry when hit by a **429** Rate Limit. **Default:** `true`.

### `client.request(method, path[, body, attachments, options])`

- `method` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) HTTP method (e.g., `'GET'`, `'POST'`, `'PATCH'`). **Default:** `'GET'`.
- `path` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) The API endpoint path (e.g., `'/channels/123/messages'`).
- `body` [\<Object\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) The JSON payload to send.
- `attachments` [\<discord.Attachment[]\>](#class-discordattachment) An array of attachment objects for file uploads.
- `options` [\<Object\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)
  - `auditLog` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) Reason to be displayed in the Discord Audit Log.
  - `headers` [\<Object\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) Additional HTTP headers.
  - `requestOptions` [\<Object\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) Options passed to the underlying `@jnode/request`.
- Returns: [\<Promise\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) Fulfills with the parsed JSON response, or `null` if status is **204**.

### `client.gateway([options])`

- `options` [\<Object\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) Options for the gateway (see [`discord.Gateway`](#class-discordgateway)).
- Returns: [\<discord.Gateway\>](#class-discordgateway) A new gateway instance.

## Class: `discord.Gateway`

- Extends: [\<EventEmitter\>](https://nodejs.org/docs/latest/api/events.html#class-eventemitter)

Handles the WebSocket connection to receive real-time events.

### `new discord.Gateway(client[, options])`

- `client` [\<discord.Client\>](#class-discordclient) An instance of the Discord client.
- `options` [\<Object\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)
  - `intents` [\<number\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#number_type) Gateway intents bitmask. **Default:** `3276799` (All non-privileged).
  - `reconnectDelay` [\<number\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#number_type) Delay (ms) before reconnecting after a close. **Default:** `5000`.
  - `connectTimeout` [\<number\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#number_type) Timeout (ms) for the initial connection. **Default:** `5000`.
  - `apiVersion` [\<number\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#number_type) Discord Gateway version. **Default:** `10`.
  - `heartbeatJitter` [\<number\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#number_type) Coefficient for heartbeat interval jitter. **Default:** `0.9`.
  - `heartbeatAckTimeout` [\<number\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#number_type) Timeout (ms) to wait for a heartbeat ACK before closing. **Default:** `3000`.
  - `presence` [\<Object\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) Initial presence information.
  - `shard` [\<number[]\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) Array of two integers `[shard_id, num_shards]`.

### `gateway.send(op[, d])`

- `op` [\<number\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#number_type) Gateway Opcode.
- `d` [\<any\>] Data payload.

Sends a raw event through the gateway.

### `gateway.close()`

Closes the WebSocket connection.

### Event: `'socketOpen'`

Emitted when the WebSocket connection is established.

### Event: `'socketClose'`

- `event` [\<CloseEvent\>]

Emitted when the WebSocket connection is closed.

### Event: `'message'`

- `data` [\<Object\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

Emitted for every raw message received from the gateway.

### Event: `<DISPATCH_EVENT_NAME>`

- `data` [\<Object\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

Emitted when a specific Discord Dispatch event is received (Opcode 0). E.G., `'READY'`, `'MESSAGE_CREATE'`, `'GUILD_CREATE'`.

### Event: `'error'`

- `err` [\<Error\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)

Emitted when a critical gateway error occurs (e.g., invalid token).

## Class: `discord.Attachment`

Represents a file to be uploaded.

### `new discord.Attachment(filename, type, body)`

- `filename` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) The name of the file (e.g., `'photo.jpg'`).
- `type` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) The MIME type (e.g., `'image/jpeg'`).
- `body` [\<Buffer\>](https://nodejs.org/docs/latest/api/buffer.html#class-buffer) | [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) The actual file content.
