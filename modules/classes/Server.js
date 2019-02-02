const Config = require('../utils/Config');
const Tools = require('../utils/Tools');

/**
 * Represents a server where the bot is present.
 */
class Server {

    constructor(idServer, prefix, language) {
        this.id = idServer;
        this.prefix = prefix;
        this.language = language;
    }

}
module.exports = Server;