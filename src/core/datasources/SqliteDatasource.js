const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');

class SqliteDatasource {

  /**
   * @return {Promise<SqliteDatasource>}
   */
  static async init() {
    if (SqliteDatasource._instance) {
      return SqliteDatasource._instance;
    }
    SqliteDatasource._instance = SqliteDatasource;

    SqliteDatasource.sql = await sqlite.open({
      filename: 'database/database.sqlite',
      driver: sqlite3.cached.Database,
    });

    return SqliteDatasource._instance;
  }

  // TODO

}

module.exports = {
  init: SqliteDatasource.init,
};
