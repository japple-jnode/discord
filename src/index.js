/*
JustDiscord/index.js
v.1.0.0

Simple Discord API package for Node.js.
Must use Node.js v22.4.0 or later for WebSocket (Discord gateway).

by JustNode Dev Team / JustApple
*/

//load node packages
const EventEmitter = require('events');

module.exports = {
	client: require('./client.js'),
	gateway: require('./gateway.js')
};