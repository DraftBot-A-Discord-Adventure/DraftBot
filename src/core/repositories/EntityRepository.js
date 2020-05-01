const AppRepository = require('repositories/AppRepository');
const Entity = require('entities/Entity');

class EntityRepository extends AppRepository {

  constructor() {
    super();
    this.datasource = DATASOURCE.SQLITE;
  }

  // TODO 2.0

}

module.exports = EntityRepository;
