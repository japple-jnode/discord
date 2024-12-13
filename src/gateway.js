/*
JustDiscord/gateway.js
v.1.0.0

Simple Discord API package for Node.js.
Must use Node.js v22.4.0 or later for WebSocket (Discord gateway).

by JustNode Dev Team / JustApple
*/

//load classes and functions
//errors from Discord Gateway
class DiscordGatewayError extends Error { constructor(...i) { super(...i); } }

//load node packages
const EventEmitter = require('events');

//Discord Gateway, recieve live messages with WebSocket
class DiscordGateway extends EventEmitter {
	constructor(client) {
		super();
		
		this.client = client;
		this.socket = {};
		this.s = null;
	}
	
	//get gateway url from api
	async getGatewayUrl() {
		const res = await this.client.apiRequest('GET', '/gateway/bot'); //make an api request
		this.client.gatewayUrl = res.json().url;
		this.client.gatewayOriginalUrl = res.json().url;
		return res.json().url;
	}
	
	//connect to gateway
	connect() {
		if ((this.socket.readyState !== 3) && this.socket.close) this.socket.close(); //close privous connect
		
		this.socket = new WebSocket(`${this.client.gatewayUrl}?v=${this.client.apiVersion}&encoding=json`); //connect
		
		if (this.client.gatewayConnectTimeout !== 0) { //set connect timeout
			this.connectTimeout = setTimeout(() => {
				this.socket.close(); //close socket
				this.emit('timeout');
				
				if (this.client.gatewayReconnectDelay >= 0) { //if auto reconnect is allowed
					setTimeout(() => {
						this.connect();
					}, this.client.gatewayReconnectDelay); //reconnect after specific time
				}
			}, this.client.gatewayConnectTimeout);
		}
		
		this.socket.addEventListener('open', (event) => { //socket opened
			this.emit('socketOpened', event); //send event with socket event
			clearTimeout(this.connectTimeout); //clear timeout if successfully connected
		});
		
		this.socket.addEventListener('close', (event) => { //socket closed
			this.emit('socketClosed', event); //send event with event (may have close code and reason)
			clearInterval(this.heartbeatInterval); //clear heatbeat interval
			
			
			if (this.client.gatewayReconnectDelay >= 0) { //if auto reconnect is allowed
				setTimeout(() => {
					this.connect();
				}, this.client.gatewayReconnectDelay); //reconnect after specific time
			}
		});
		
		this.socket.addEventListener('error', (event) => { //socket error
			this.emit('socketError', event); //send event with event (may have error info)
		});
		
		this.socket.addEventListener('message', (event) => { //recieve gateway message
			try {
				this.emit('socketMessage', event); //send event with event (may have data and more)
				
				const data = JSON.parse(event.data); //parse json data
				this.emit('message', data); //send event with json data
				
				//auto handle by op
				switch (data.op) {
					case 0: //Dispatch
						this.emit(data.t, data.d); //send t event with d
						this.s = data.s ?? this.s; //save s number there is
						
						//auto handle by t
						switch (data.t) {
							case 'READY': //save resume data
								this.sessionId = data.d['session_id'];
								this.client.gatewayUrl = data.d['resume_gateway_url'];
								break;
							default:
								break;
						}
						break;
					case 7: //Reconnect, need to reconnect
						this.socket.close(); //close socket
						break;
					case 9: //Invalid Session, need to reconnect
						this.client.gatewayUrl = this.client.gatewayOriginalUrl; //reset url
						this.sessionId = undefined; //reset session id
						this.socket.close(); //close socket
						break;
					case 10: //Hello
						this.heartbeatIntervalMS = data.d['heartbeat_interval'] * 0.9; //save heart beat interval time
						this.sendMessage(1); //send first heartbeat
						
						clearInterval(this.heartbeatInterval); //clear old interval
						this.heartbeatInterval = setInterval(() => { //start heartbeat interval
							this.sendMessage(1);
						}, this.heartbeatIntervalMS);
						
						if (this.sessionId) { //may be resumed
							this.sendMessage(6, { //Resume
								token: this.client.token,
								session_id: this.sessionId,
								seq: this.s
							});
						} else { //start new session
							this.sendMessage(2, { //Identify
								token: this.client.token,
								properties: {
									os: process.platform,
									browser: 'Node.js',
									device: 'JustDiscord'
								},
								intents: this.client.gatewayIntents
							});
						}
						break;
					default:
						break;
				}
			} catch (err) {
				if (this.client.gatewayThrowError) { //throw gateway error
					err.name = 'DiscordGatewayError'; //change the name of the error
					throw err;
				}
			}
		});
	}
	
	sendMessage(op, d = null) {
		this.socket.send(JSON.stringify({ op, d }));
	}
}

module.exports = DiscordGateway;