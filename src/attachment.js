/*
@jnode/discord/attachment.js
v2

Simple Discord API package for Node.js.
Must use Node.js v22.4.0 or later for WebSocket (Discord gateway).

by JustApple
*/

// attachment class
class Attachment {
    constructor(filename, type, body) {
        this.filename = filename;
        this.type = type;
        this.body = body;
    }
}

// export
module.exports = Attachment;