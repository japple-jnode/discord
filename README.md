# JustDiscord

Simple Discord API package for Node.js.

```shell
npm install @jnode/discord
```

## Basic Usage

### Import JustDiscord
```js
const discord = require('@jnode/discord');
```

### Create a Client
```js
const client = new discord.Client('BOT_TOKEN');
```

### Connect to Discord Gateway
```js
client.connectGateway((gateway) => {
    // receive Discord gateway "READY" event
    gateway.on('READY', (d) => {
        console.log('Connected to Discord.');
    });
});
```

## Class: `Client`

The main class for interacting with the Discord API and Gateway.

### Constructor
```js
new discord.Client(token, options = {})
```
- `token`: Your Discord bot token.
- `options`: An optional object for setting various client options:
  - `apiVersion`: The Discord API version. Default is `10`.
  - `apiBase`: The base URL of the Discord API. Default is `discord.com/api`.
  - `apiAutoRetry`: Whether to auto-retry requests when receiving a 429 error. Default is `true`.
  - `apiThrowError`: Whether to throw errors when the API status code is not 2xx. Default is `true`.
  - `gatewayIntents`: The gateway intents used for connecting to the Gateway. Default is `0b11111111111111111000110011`. You can find more about intents in the [Discord Developer Documentation](https://discord.com/developers/docs/events/gateway).
  - `gatewayUrl`: The base URL for the Discord Gateway. Default is `wss://gateway.discord.gg`.
  - `gatewayReconnectDelay`: The delay (in milliseconds) before attempting to reconnect to the gateway. Default is `5000`. Set to less than 0 to disable auto-reconnect.
  - `gatewayConnectTimeout`: The timeout (in milliseconds) before giving up on connecting to the gateway. Default is `5000`. Set to less than 0 to disable connect timeout.
  - `gatewayThrowError`: Whether to throw errors when the gateway encounters an issue. Default is `true`.

### Methods

- `apiUrl(path)`: Returns the full API URL with the base, version, and given path.
    - `path`: API endpoint path. Example: `/channels/123456789`.
    - **Returns**: `string` - The full API URL. Example: `https://discord.com/api/v10/channels/123456789`.

- `async apiRequest(method = 'GET', path = '/', body)`: Makes an HTTP request to the Discord API, find out more at [Discord Developer Documentation](https://discord.com/developers/docs).
    - `method`: HTTP method (e.g. `GET`, `POST`, `PUT`, `DELETE`). Default is `GET`.
    - `path`: API endpoint path. Default is `/`. Example: `/channels/123456789/messages`.
    - `body`: Request body data (will be stringified). Example: `{ content: 'Hello, Discord!' }`.
    - **Returns**: `Promise<RequestResponse>` - A promise that resolves to a `RequestResponse` object.
    - **Example**:
    ```js
    client.apiRequest('POST', '/channels/123456789/messages', { content: 'Hello, Discord!' })
    .then(res => {
        if (res.statusCode === 200) {
            console.log('Message sent successfully!');
        } else {
            console.error('Failed to send message:', res.statusCode, res.text());
        }
    }).catch(err => {
        console.error('Error sending message:', err);
    });
    ```

- `async apiRequestMultipart(method = 'GET', path = '/', body, attachments = [])`: Makes a multipart HTTP request to the Discord API.
    - `method`: HTTP method (e.g. `GET`, `POST`, `PUT`, `DELETE`). Default is `GET`.
    - `path`: API endpoint path. Default is `/`. Example: `/channels/123456789/messages`.
    - `body`: Request body data (will be stringified). Example: `{ content: 'Hello, Discord!' }`.
    - `attachments`: An array of attachments, each attachment is an object:
        - `name`: Name of the file. Example: `image.png`
        - `type` (Optional): Content type of the data. Defaults to `application/octet-stream`.
        - `data` (Option 1): Data (string or Buffer) of this file.
        - `file` (Option 2): Path to a local file.
        - `encoded`/`base64` (Option 3): base64 encoded data string.
        - `stream` (Option 4): Any readable stream.
    - **Returns**: `Promise<RequestResponse>` - A promise that resolves to a `RequestResponse` object.
    - **Example**:
    ```js
    const fs = require('fs').promises;

    async function uploadFile(channelId, filePath) {
        const fileData = await fs.readFile(filePath);
        const fileType = 'image/png';
        const fileName = 'my_image.png';

        client.apiRequestMultipart('POST', `/channels/${channelId}/messages`, { content: 'Here\'s an image!' }, [{
            name: fileName,
            type: fileType,
            data: fileData
        }]).then(res => {
            if (res.statusCode === 200) {
                console.log('File uploaded successfully!');
            } else {
                console.error('Failed to upload file:', res.statusCode, res.text());
            }
        }).catch(err => {
            console.error('Error uploading file:', err);
        });
    }
    uploadFile('123456789', './my_image.png');
    ```

- `async connectGateway(cb)`: Connects to the Discord Gateway.
    - `cb`: A callback function that takes a `gateway` object as an argument.
    - **Returns**: `Promise<Gateway>` - A promise that resolves to a `Gateway` object.
    - **Example**:
    ```js
    client.connectGateway((gateway) => {
        gateway.on('READY', (data) => {
            console.log('Connected to Discord, user id:', data.user.id);
        });
        gateway.on('MESSAGE_CREATE', (message) => {
            if (message.content === '!ping') {
               console.log('Recieve Ping Message')
            }
        });
    });
    ```

## Class: `Gateway`

Manages the Discord Gateway connection for receiving real-time events. You can find more about gateway events in the [Discord Developer Documentation](https://discord.com/developers/docs/events/gateway).

### Events

- `socketOpened`: Emitted when the WebSocket connection is opened.
  - `event`: A WebSocket event object.
- `socketClosed`: Emitted when the WebSocket connection is closed.
  - `event`: A WebSocket event object.
- `socketError`: Emitted when a WebSocket error occurs.
  - `event`: A WebSocket event object.
- `socketMessage`: Emitted when a raw WebSocket message is received.
    - `event`: A WebSocket event object.
- `message`: Emitted when a complete JSON payload is received.
    - `data`: A JSON object.
- Discord Gateway Event (`READY`, `MESSAGE_CREATE`... etc.): The gateway will auto dispatch discord events. Check [Discord Developer Documentation](https://discord.com/developers/docs/events/gateway-events) for all avaliable events. The event callback will be a data object from discord.

### Methods

- `async getGatewayUrl()`: Retrieves the gateway URL from the Discord API.
    - **Returns**: `Promise<string>` - A promise that resolves to the gateway URL.

- `connect()`: Opens the WebSocket connection to the Discord Gateway.

- `sendMessage(op, d = null)`: Sends a message to the Discord Gateway.
    - `op`: Opcode of the message. Check [Discord Developer Documentation](https://discord.com/developers/docs/events/gateway-events) for all avaliable opcodes.
    - `d`: Payload of the message.
     - **Example**:
    ```js
    gateway.sendMessage(1, {}); //send heartbeat
    gateway.sendMessage(2, { //Identify
        token: 'BOT_TOKEN',
        properties: {
            os: process.platform,
            browser: 'Node.js',
            device: 'JustDiscord'
        },
        intents: 0b11111111111111111000110011 //replace with your intents
    });
    ```

## Class: `DiscordAPIError`

An error that is thrown when the Discord API returns a non-2xx status code.

### Properties

- `message`: The error message.
- `body`: The response body.
- `headers`: The response headers.

## Helper functions

- `RequestResponse` class with properties like:
    - `statusCode`: Status code.
    - `headers`: Response headers.
    - `text(encoding)`: Return response body in string, with optional encoding. Example: `res.text('utf-8')`.
    - `json()`: Return response body in JSON format, or `undefined` when cannot parse JSON. Example: `res.json()`.