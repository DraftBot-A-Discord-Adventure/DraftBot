const AppRepository = require('repositories/AppRepository');
const Entity = require('entities/Entity');

class EntityRepository extends AppRepository {

  constructor() {
    super();
    this.datasource = DATASOURCE.SQLITE;
  }

  // TODO

}

module.exports = EntityRepository;
