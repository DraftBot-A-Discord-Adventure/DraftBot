const AppRepository = require('repositories/AppRepository');
const Entity = require('entities/Entity');

/**
 * @property {String} datasource
 * @property {module:sqlite3.Database} sql
 */
class EntityRepository extends AppRepository {

  constructor() {
    super();
    this.datasource = DATASOURCE.SQLITE;
  }

  // TODO 2.x need some debug en takes care of primaryKey and foreignKey
  // /**
  //  * Return an entitu by id, or a mocked entity with default values
  //  * @param {String} id
  //  * @return {EntityRepository}
  //  */
  // findById(id) {
  //   this._primaryKey = id;
  //   this._resultsSet[this.constructor.name].push(this.sql.get(`SELECT * FROM entity WHERE id = ?`, [id]));
  //   return this;
  // }
  //
  // /**
  //  * @return {EntityRepository}
  //  */
  // async player() {
  //   getRepository('player').findById(this._primaryKey);
  //   return getRepository('player');
  // }
  //
  // /**
  //  * @return {EntityRepository}
  //  */
  // async inventory() {
  //   getRepository('inventory').findById(this._primaryKey);
  //   return getRepository('inventory');
  // }

}

module.exports = EntityRepository;
