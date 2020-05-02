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

  // TODO 2.0

}

module.exports = EntityRepository;
