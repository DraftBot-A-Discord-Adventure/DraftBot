const fs = require('fs');
const path = require("path");
const Sequelize = require('sequelize');

class Database {

  /**
   * @return {Promise<void>}
   */
  static async init() {
    Database.sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: 'database/database.sqlite',
      logging: false
    });

    await Database.migrate();
    await Database.setEverybodyAsUnOccupied();

    let modelsFiles = await fs.promises.readdir('src/core/models');
    for (let modelFile of modelsFiles) {
      let modelName = modelFile.split('.')[0];
      global[modelName] = Database.sequelize['import'](`models/${modelName}`);
    }
  }

  static async migrate() {
    const config = {
      force: false,
      table: 'migrations',
      migrationsPath: 'database/migrations'
    };
    const { force, table, migrationsPath } = config;
    const location = path.resolve(migrationsPath);
    const migrations = await new Promise((resolve, reject) => {
      fs.readdir(location, (err, files) => {
        if (err) {
          return reject(err);
        }
        resolve(files
            .map(x => x.match(/^(\d+).(.*?)\.sql$/))
            .filter(x => x !== null)
            .map(x => ({ id: Number(x[1]), name: x[2], filename: x[0] }))
            .sort((a, b) => Math.sign(a.id - b.id)));
      });
    });
    if (!migrations.length) {
      throw new Error(`No migration files found in '${location}'.`);
    }
    await Promise.all(migrations.map(migration => new Promise((resolve, reject) => {
      const filename = path.join(location, migration.filename);
      fs.readFile(filename, 'utf-8', (err, data) => {
        if (err) {
          return reject(err);
        }
        const [up, down] = data.split(/^--\s+?down\b/im);
        if (!down) {
          const message = `The ${migration.filename} file does not contain '-- Down' separator.`;
          return reject(new Error(message));
        }
        /* eslint-disable no-param-reassign */
        migration.up = up.replace(/^-- .*?$/gm, '').trim(); // Remove comments
        migration.down = down.trim(); // and trim whitespaces
        /* eslint-enable no-param-reassign */
        resolve();
      });
    })));
    await Database.sequelize.query(`CREATE TABLE IF NOT EXISTS "${table}" (
      id   INTEGER PRIMARY KEY,
      name TEXT    NOT NULL,
      up   TEXT    NOT NULL,
      down TEXT    NOT NULL
    )`);
    let dbMigrations = await Database.sequelize.query(`SELECT id, name, up, down FROM "${table}" ORDER BY id ASC`);

    const lastMigration = migrations[migrations.length - 1];
    for (const migration of dbMigrations[0].slice().sort((a, b) => Math.sign(b.id - a.id))) {
      if (!migrations.some(x => x.id === migration.id) || (force && migration.id === lastMigration.id)) {
        await Database.sequelize.query('BEGIN');
        try {
          let queries = migration.down.split('\r\n');
          queries.forEach(query => {
            if (query !== '') {
              Database.sequelize.query(query)
                  .catch((err) => {console.log(err);});
            }
          });
          await Database.sequelize.query(`DELETE FROM "${table}" WHERE id = ${migration.id}`);
          await Database.sequelize.query('COMMIT');
          dbMigrations[0] = dbMigrations[0].filter(x => x.id !== migration.id);
        }
        catch (err) {
          await Database.sequelize.query('ROLLBACK');
          throw err;
        }
      }
      else {
        break;
      }
    }

    const lastMigrationId = dbMigrations[0].length ? dbMigrations[0][dbMigrations[0].length - 1].id : 0;
    for (const migration of migrations) {
      if (migration.id > lastMigrationId) {
        await Database.sequelize.query('BEGIN');
        try {
          let queries = migration.up.split('\r\n');
          queries.forEach(query => {
            if (query !== '') {
              Database.sequelize.query(query)
                  .catch((err) => {console.log(err);});
            }
          });
          await Database.sequelize.query(`INSERT INTO "${table}" (id, name, up, down) VALUES ("${migration.id}", "${migration.name}", "${migration.up}", "${migration.down}")`);
          await Database.sequelize.query('COMMIT');
        }
        catch (err) {
          await Database.sequelize.query('ROLLBACK');
          throw err;
        }
      }
    }
  }

  static async setEverybodyAsUnOccupied() {
    Database.sequelize.query(`UPDATE entities SET effect = "${EFFECT.SMILEY}" WHERE effect = "${EFFECT.CLOCK10}"`);
  }

}

module.exports = {
  init: Database.init,
};
