const EntityAbstract = require("entities/EntityAbstract");

class Server extends EntityAbstract {

    constructor(id, prefix, language) {
        super();
        this.id = id;
        this.prefix = prefix;
        this.language = language;
    }

}

module.exports = Server;
