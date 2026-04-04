/*
@jnode/discord/gateway.js
v2

Simple Discord API package for Node.js.
Must use Node.js v22.4.0 or later for WebSocket (Discord gateway).

by JustNode Dev Team / JustApple
*/

// dependencies
const EventEmitter = require('events');

// Discord gateway, recieve live events with WebSocket
class DiscordGateway extends EventEmitter {
	constructor(client, options = {}) {
		super();

		this.client = client;

		// gateway options
		this.intents = options.intents ?? 0b11001100011111111111111111;
		this.reconnectDelay = options.reconnectDelay ?? 5000;
		this.connectTimeout = options.connectTimeout ?? 5000;
		this.apiVersion = options.apiVersion ?? 10;
		this.heartbeatJitter = options.heartbeatJitter ?? 0.9;
		this.heartbeatAckTimeout = options.heartbeatAckTimeout ?? 3000;
		this.shard = options.shard;
		this.largeThreshold = options.largeThreshold;
		this.presence = options.presence;

		this._s = null;

		// connect anyways
		this.connect();
	}

	// connect to gateway
	async connect() {
		// get gateway url
		const gatewayUrl = this._resumeUrl ?? this.client._gatewayUrl ?? (this.client._gatewayUrl = (await this.client.request('GET', '/gateway/bot')).url);

		// create connection
		this.socket = new WebSocket(`${gatewayUrl}?v=${this.apiVersion}&encoding=json`);

		// connect timeout
		if (this.connectTimeout > 0) {
			clearTimeout(this._connectTimeout);
			this._connectTimeout = setTimeout(() => {
				this.socket.close();
				this.emit('timeout');
			}, this.connectTimeout);
		}

		// socket open
		this.socket.addEventListener('open', (event) => {
			this.emit('socketOpen', event);
		});

		// socket close
		this.socket.addEventListener('close', (event) => {
			this.emit('socketClose', event);
			clearTimeout(this._connectTimeout);
			clearInterval(this._heartbeatInterval);
			clearTimeout(this._heartbeatTimeout);

			// error close
			if ([4004, 4010, 4011, 4012, 4013, 4014].includes(event.code)) {
				const err = new Error(event.reason);
				err.code = event.code;
				this.emit('error', err);
				return;
			}

			// reconnect
			if (this.reconnectDelay >= 0) {
				setTimeout(() => {
					this.connect();
				}, this.reconnectDelay);
			}
		});

		// error
		this.socket.addEventListener('error', (event) => {
			this.emit('socketError', event);
		});

		// message
		this.socket.addEventListener('message', (event) => {
			this.emit('socketMessage', event);

			const data = JSON.parse(event.data);
			this.emit('message', data);

			// handle by op
			switch (data.op) {
				case 0: // dispatch
					this.emit(data.t, data.d);
					this._s = data.s ?? this._s;

					// ready event
					if (data.t === 'READY') {
						this._sessionId = data.d.session_id;
						this._resumeUrl = data.d.resume_gateway_url;
					}
					break;
				case 7: // reconnect
					this.socket.close();

					break;
				case 9: // invaild session
					if (!data.d) { // start new connection
						this._resumeUrl = null;
						this._sessionId = null;
						this._s = null;
					}
					this.socket.close();
					break;
				case 10: // hello
					clearTimeout(this._connectTimeout);

					this.heartbeat();

					// start heatbeat interval
					clearInterval(this._heartbeatInterval);
					this._heartbeatInterval = setInterval(() => {
						this.heartbeat();
					}, data.d.heartbeat_interval * this.heartbeatJitter);

					// start identify or resume
					if (this._sessionId && this._resumeUrl) { // resume
						this.send(6, {
							token: this.client.token,
							session_id: this._sessionId,
							seq: this._s
						});
					} else { // identify
						this.send(2, {
							token: this.client.token,
							intents: this.intents,
							properties: {
								os: process.platform,
								browser: 'jnode_discord',
								device: 'jnode_discord'
							},
							presence: this.presence,
							shard: this.shard,
							large_threshold: this.largeThreshold
						});
					}

					break;
				case 11: // heartbeat ack
					clearTimeout(this._heartbeatTimeout);
					break;
			}
		});
	}

	heartbeat() {
		this.send(1, this._s);

		// could not receive heartbeat ack
		clearTimeout(this._heartbeatTimeout);
		this._heartbeatTimeout = setTimeout(() => {
			this.emit('heartbeatTimeout');
			this.socket.close();
		}, this.heartbeatAckTimeout);
	}

	// sends a gateway event
	send(op, d = null) {
		this.socket.send(JSON.stringify({ op, d }));
	}

	// closes the gateway
	close() {
		this.socket.close();
	}
}

// export
module.exports = DiscordGateway;