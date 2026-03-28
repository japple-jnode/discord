/*
@jnode/discord/client.js
v2

Simple Discord API package for Node.js.
Must use Node.js v22.4.0 or later for WebSocket (Discord gateway).

by JustApple
*/

// dependencies
const { request, FormPart } = require('@jnode/request');
const DiscordGateway = require('./gateway.js');

// errors from Discord API
class DiscordAPIError extends Error {
	constructor(res) {
		super(`Discord API respond with code ${res.statusCode}.`);
		this.res = res;
	}
}

// Discord client
class DiscordClient {
	constructor(token, options = {}) {
		this.token = token;

		// client api options
		this.baseUrl = options.baseUrl ?? 'https://discord.com/api/v10';
		this.autoRetry = options.autoRetry ?? true;
	}

	// make request
	async request(method = 'GET', path = '/', body, attachments = [], options = {}) {
		// generate body
		let reqBody;
		if (!attachments?.length) {
			reqBody = JSON.stringify(body);
		} else {
			reqBody = [new FormPart('payload_json', JSON.stringify(body), { 'Content-Type': 'application/json' })];

			// add every attachment
			for (let i in attachments) {
				attachments[i].name = attachments[i].name ?? `files[${i}]`;
				reqBody.push(attachments[i]);
			}
		}

		// make request
		const res = await request(method, this.baseUrl + path, reqBody, {
			'Authorization': `Bot ${this.token}`,
			'User-Agent': 'DiscordBot',
			'Content-Type': (body !== undefined) ? 'application/json' : null,
			'X-Audit-Log-Reason': options.auditLog ? encodeURIComponent(options.auditLog) : null,
			...options.headers
		}, options.requestOptions);

		// retry if recieved 429
		if ((res.statusCode === 429) && this.autoRetry) {
			await delay((await res.json()).retry_after * 1000);
			return this.request(method, path, body, attachments, options);
		}

		// throw error if not 2xx
		if ((res.statusCode > 299) || (res.statusCode < 200)) throw new DiscordAPIError(res);

		try {
			return (res.statusCode === 204) ? null : await res.json();
		} catch {
			return await res.text();
		}
	}

	gateway(options) {
		return new DiscordGateway(this, options);
	}
}

// wait time (ms)
function delay(ms) {
	return new Promise((resolve, reject) => { setTimeout(resolve, ms); });
}

// export
module.exports = DiscordClient;