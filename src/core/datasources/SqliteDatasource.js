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

    await SqliteDatasource.databaseMigrations();
    await SqliteDatasource.setEverybodyAsUnOccupied();

    return SqliteDatasource._instance;
  }

  /**
   * This function analyses the passed database and check if it is valid.
   */
  static async databaseMigrations() {
    await SqliteDatasource.sql.migrate({
      migrationsPath: 'database/migrations',
    }).catch(console.error);
  }

  /**
   * Allow to set the state of all the player to normal in order to allow them to play
   */
  static async setEverybodyAsUnOccupied() {
    await SqliteDatasource.sql
        .run(`UPDATE entity
              SET effect = ?
              WHERE effect = ?`,
            EFFECT.SMILEY, EFFECT.CLOCK10)
        .catch(console.error);
  }

}

module.exports = {
  init: SqliteDatasource.init,
};
