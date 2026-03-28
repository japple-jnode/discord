/*
@jnode/discord/index.js
v2

Simple Discord API package for Node.js.
Must use Node.js v22.4.0 or later for WebSocket (Discord gateway).

by JustApple
*/

// export
module.exports = {
	Attachment: require('./attachment.js'),
	Client: require('./client.js'),
	Gateway: require('./gateway.js')
};