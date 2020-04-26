const Entity = require("orm/entities/Entity");

class Server extends Entity {

    constructor(id, prefix, language) {
        super();
        this.id = id;
        this.prefix = prefix;
        this.language = language;
    }

}

module.exports = Server;
