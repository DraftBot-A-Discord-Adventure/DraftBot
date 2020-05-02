const AppRepository = require('repositories/AppRepository');
const Server = require('entities/Server');

/**
 * @property {String} datasource
 * @property {module:sqlite3.Database} sql
 */
class ServerRepository extends AppRepository {

  constructor() {
    super();
    this.datasource = DATASOURCE.SQLITE;
  }

  /**
   * Allow to get the current server
   * @param {Number} id
   * @return {Promise<Server|boolean|void>}
   */
  async getById(id) {
    return await this.sql
        .get(`SELECT *
              FROM server
              WHERE id = ?`, id)
        .then(server => {
          if (server) {
            return new Server(server);
          } else {
            return false;
          }
        })
        .catch(console.error);
  }

  /**
   * Allow to get the current server or create if not exist
   * @param {Number} id
   * @return {Promise<Server|void>}
   */
  async getByIdOrCreate(id) {
    return this.sql
        .get(`SELECT *
              FROM server
              WHERE id = ?`, id)
        .then(async server => {
          if (server) {
            return new Server(server);
          } else {
            // TODO 2.0
            return await this.create(
                new Server(id, Config.server.prefix, Config.server.language));
          }
        })
        .catch(console.error);
  }

  /**
   * Allow to save a new server in the database and return it
   * @param {Server} server
   * @return {Promise<Server|void>}
   */
  async create(server) {
    await this.sql
        .run(`INSERT INTO server (id, prefix, language)
              VALUES (?, ?, ?)`, server.id, server.prefix,
            server.language)
        .catch(console.error);

    return server;
  }

  /**
   * Allow to update a server in the database and return it
   * @param {Server} server
   * @return {Promise<Server|void>}
   */
  async update(server) {
    await this.sql
        .run(`UPDATE server
              SET prefix   = ?,
                  language = ?
              WHERE id = ?`, server.prefix,
            server.language, server.id)
        .catch(console.error);

    return server;
  }

  /**
   * TODO 2.0 refactor
   * Allow to get the validation informations of a guild
   * @param {*} guilde - The guild that has to be checked
   */
  getValidationInfos(guilde) {
    let nbMembres = guilde.members.filter(member => !member.user.bot).size;
    let nbBot = guilde.members.filter(member => member.user.bot).size;
    let ratio = Math.round((nbBot / nbMembres) * 100);
    let validation = ':white_check_mark:';
    if (ratio > 30 || nbMembres < 30 || (nbMembres < 100 && ratio > 20)) {
      validation = ':x:';
    } else {
      if (ratio > 20 || nbBot > 15 || nbMembres < 100) {
        validation = ':warning:';
      }
    }
    return {validation, nbMembres, nbBot, ratio};
  }

}

module.exports = ServerRepository;
