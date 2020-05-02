const EntityAbstract = require("entities/EntityAbstract");

/**
 * @property {String} id
 * @property {String} prefix
 * @property {String} language
 */
class Server extends EntityAbstract {

    /**
     * @param {String} id
     * @param {String} prefix
     * @param {String} language
     */
    constructor({id, prefix, language}) {
        super();
        this.id = id;
        this.prefix = prefix;
        this.language = language;
    }

}

module.exports = Server;
