const RepositoryAbstract = require("repositories/RepositoryAbstract");
const Server = require("entities/Server");

class ServerRepository extends RepositoryAbstract {

    /**
     * Allow to get the current server
     * @param {number} id
     * @return {Promise<Server|boolean|void>}
     */
    async getById(id) {
        return await this.sql
            .get(`SELECT * FROM server WHERE id = ?`, id)
            .then(server => {
                if (server) {
                    return new Server(server.id, server.prefix, server.language);
                } else {
                    return false;
                }
            })
            .catch(console.error);
    }

    /**
     * Allow to get the current server or create if not exist
     * @param {number} id
     * @return {Promise<Server|void>}
     */
    async getByIdOrCreate(id) {
        return await this.sql
            .get(`SELECT * FROM server WHERE id = ?`, id)
            .then(async server => {
                if (server) {
                    return new Server(server.id, server.prefix, server.language);
                } else {
                    return await this.create(new Server(id, Config.server.prefix, Config.server.language));
                }
            })
            .catch(console.error);
    }

    /**
     * Return an server created from the defaul values and save it to the database
     * @param {Server} server
     * @return {Promise<Server|void>}
     */
    async create(server) {
        return await this.sql
            .run(`INSERT INTO server (id, prefix, language) VALUES (?, ?, ?)`, server.get('id'), server.get('prefix'), server.get('language'))
            .then(() => {
                return server;
            })
            .catch(console.error);
    }

    /**
     * Allow to save the current state of a server in the database
     * @param {Server} server
     * @return {Promise<Server|void>}
     */
    async update(server) {
        return await this.sql
            .run(`UPDATE server SET id = ?, prefix = ?, language = ? WHERE id = ?`, server.get('id'), server.get('prefix'), server.get('language'), server.get('id'))
            .then(() => {
                return server;
            })
            .catch(console.error);
    }

    /**
     * TODO refactor
     * Allow to get the validation informations of a guild
     * @param {*} guilde - The guild that has to be checked
     */
    getValidationInfos(guilde) {
        let nbMembres = guilde.members.filter(member => !member.user.bot).size;
        let nbBot = guilde.members.filter(member => member.user.bot).size;
        let ratio = Math.round((nbBot / nbMembres) * 100);
        let validation = ":white_check_mark:";
        if (ratio > 30 || nbMembres < 30 || (nbMembres < 100 && ratio > 20)) {
            validation = ":x:";
        }
        else {
            if (ratio > 20 || nbBot > 15 || nbMembres < 100) {
                validation = ":warning:";
            }
        }
        return { validation, nbMembres, nbBot, ratio };
    }

}

module.exports = ServerRepository;
