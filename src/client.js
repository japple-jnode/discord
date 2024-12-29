/*
JustDiscord/client.js
v.1.0.0

Simple Discord API package for Node.js.
Must use Node.js v22.4.0 or later for WebSocket (Discord gateway).

by JustNode Dev Team / JustApple
*/

//load jnode packages
const request = require('@jnode/request');

//load classes and functions
const DiscordGateway = require('./gateway.js');

//error types
//errors from Discord API
class DiscordAPIError extends Error {
	constructor(code, body, headers) {
		super(`Discord API respond with code ${code}.`);
		this.body = body;
		this.headers = headers;
	}
}

//Discord Client, everything starts here
class DiscordClient  {
	constructor(token, options = {}) {
		this.token = token;
		
		//client api options
		this.apiVersion = options.apiVersion ?? 10;
		this.apiBase = options.apiBase ?? 'discord.com/api';
		this.apiAutoRetry = options.apiAutoRetry ?? true;
		this.apiThrowError = options.apiThrowError ?? true; //throw error while api status code is not 2xx
		
		//client gateway options
		this.gatewayIntents = options.gatewayIntents ?? 0b11111111111111111000110011;
		this.gatewayUrl = options.gatewayUrl ?? 'wss://gateway.discord.gg';
		this.gatewayOriginalUrl = this.gatewayUrl;
		this.gatewayReconnectDelay = options.gatewayReconnectDelay ?? 5000; //less than 0 to disable auto reconnect
		this.gatewayConnectTimeout = options.gatewayConnectTimeout ?? 5000; //less than 0 to disable connect timeout (may cause error)
		this.gatewayThrowError = options.gatewayThrowError ?? true; //throw error while gateway went something wrong
		
		//gateway
		this.gateway = new DiscordGateway(this);
	}
	
	//get full api url with base, version and path
	apiUrl(path) {
		return `https://${this.apiBase}/v${this.apiVersion}${path}`;
	}
	
	//make an request to Discord
	async apiRequest(method = 'GET', path = '/', body) {
		const res = await request.request(method, this.apiUrl(path), {
			'Authorization': `Bot ${this.token}`,
			'User-Agent': 'DiscordBot',
			'Content-Type': (body !== undefined) ? 'application/json' : null
		}, (body !== undefined) ? JSON.stringify(body) : undefined); //make an request
		
		if ((res.code === 429) && this.apiAutoRetry) { //retry if recieved 429
			await delay(res.json().retry_after);
			return this.apiRequest(method, path, body);
		}
		
		if (((res.code > 299) || (res.code < 200)) && this.apiThrowError) { //throw error if not 2xx
			throw new DiscordAPIError(res.code, res.json() ?? res.text(), res.headers);
		}
		
		return res;
	}
	
	//make an multi part request to Discord
	async apiRequestMultipart(method = 'GET', path = '/', body, attachments = []) {
		let parts = [];
		parts.push({ //json data
			disposition: 'form-data; name="payload_json"',
			type: 'application/json',
			data: JSON.stringify(body)
		});
		
		for (let i = 0; i < attachments.length; i++) { //add every attachment
			parts.push({
				disposition: `form-data; name="files[${i}]"; filename="${encodeURIComponent(attachments[i].name)}"`,
				type: attachments[i].type,
				data: attachments[i].data,
				base64: attachments[i].encoded
			});
		}
		
		const res = await request.multipartRequest(method, this.apiUrl(path), {
			'Authorization': `Bot ${this.token}`,
			'User-Agent': 'DiscordBot'
		}, parts); //make an request
		
		if ((res.code === 429) && this.apiAutoRetry) { //retry if recieved 429
			await delay(res.json().retry_after);
			return this.apiRequest(method, path, body, multipart, true);
		}
		
		if (((res.code > 299) || (res.code < 200)) && this.apiThrowError) { //throw error if not 2xx
			throw new DiscordAPIError(res.code, res.json() ?? res.text(), res.headers);
		}
		
		return res;
	}
	
	async connectGateway(cb) {
		await this.gateway.getGatewayUrl();
		this.gateway.connect();
		cb(this.gateway);
		return this.gateway;
	}
}

//wait time (ms)
function delay(ms) {
	return new Promise((resolve, reject) => { setTimeout(resolve, ms); });
}

module.exports = DiscordClient;