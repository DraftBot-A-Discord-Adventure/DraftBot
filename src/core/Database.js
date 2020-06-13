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

    let modelsFiles = await fs.promises.readdir('src/core/models');
    for (let modelFile of modelsFiles) {
      let modelName = modelFile.split('.')[0];
      global[modelName] = Database.sequelize['import'](`models/${modelName}`);
    }

    await Database.setAssociations();
    await Database.populateJsonFilesTables([
        'Armors', 'Weapons', 'Objects', 'Potions'
    ]);
    await Database.setEverybodyAsUnOccupied();
  }

  /**
   * @return {Promise<void>}
   */
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

    const lastMigrationId = dbMigrations[0].length ? dbMigrations[0][dbMigrations[0].length - 1].id : 0;
    for (const migration of migrations) {
      if (migration.id > lastMigrationId) {
        await Database.sequelize.query('BEGIN');
        try {
          let queries = migration.up.split((require('os')).EOL);
          for (const entry of queries) {
            if (entry !== '') {
              Database.sequelize.query(entry);
            }
          }
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

  /**
   * @return {Promise<void>}
   */
  static async setAssociations() {
    Entities.hasOne(Players, {
      foreignKey: 'entity_id',
      as: 'Player'
    });

    Players.belongsTo(Entities, {
      foreignKey: 'entity_id',
      as: 'Entity'
    });
    Players.belongsTo(Guilds, {
      foreignKey: 'guild_id',
      as: 'Guild'
    });
    Players.belongsTo(Guilds, {
      foreignKey: 'id',
      targetKey: 'chief_id',
      as: 'Chief'
    });
    Players.hasOne(Inventories, {
      foreignKey: 'player_id',
      as: 'Inventory'
    });

    Guilds.hasMany(Players, {
      foreignKey: 'guild_id',
      as: 'Members'
    });
    Guilds.hasOne(Players, {
      foreignKey: 'id',
      sourceKey: 'chief_id',
      as: 'Chief'
    });

    Inventories.belongsTo(Players, {
      foreignKey: 'player_id',
      as: 'Player'
    });
    Inventories.hasOne(Weapons, {
      foreignKey: 'id',
      sourceKey: 'weapon_id',
      as: 'Weapon'
    });
    Inventories.hasOne(Armors, {
      foreignKey: 'id',
      sourceKey: 'armor_id',
      as: 'Armor'
    });
    Inventories.hasOne(Potions, {
      foreignKey: 'id',
      sourceKey: 'potion_id',
      as: 'Potion'
    });
    Inventories.hasOne(Objects, {
      foreignKey: 'id',
      sourceKey: 'object_id',
      as: 'ActiveObject'
    });
    Inventories.hasOne(Objects, {
      foreignKey: 'id',
      sourceKey: 'backup_id',
      as: 'BackupObject'
    });

    Events.hasMany(Possibilities, {
      foreignKey: 'event_id',
      as: 'Possibilities'
    });

    Possibilities.belongsTo(Events, {
      foreignKey: 'event_id',
      as: 'Event'
    });
  }

  /**
   * @param {String[]} folders
   * @return {Promise<void>}
   */
  static async populateJsonFilesTables(folders) {
    for (const folder of folders) {

      await global[folder].destroy({truncate: true});

      let files = await fs.promises.readdir(`ressources/text/${folder.toLowerCase()}`);

      let filesContent = [];
      for (const file of files) {
        let fileName = file.split('.')[0];
        let fileContent = (require(`ressources/text/${folder.toLowerCase()}/${file}`));
        fileContent.id = fileName;
        fileContent.fr = fileContent.translations.fr;
        fileContent.en = fileContent.translations.en;
        filesContent.push(fileContent);
      }

      await global[folder].bulkCreate(filesContent);
    }

    // Handle special case Events & Possibilities
    await Events.destroy({truncate: true});
    await Possibilities.destroy({truncate: true});

    let files = await fs.promises.readdir(`ressources/text/events`);
    let eventsContent = [];
    let possibilitiesContent = [];
    for (const file of files) {
      let fileName = file.split('.')[0];
      let fileContent = (require(`ressources/text/events/${file}`));

      fileContent.id = fileName;
      fileContent.fr = fileContent.translations.fr;
      fileContent.en = fileContent.translations.en;
      eventsContent.push(fileContent);

      for (const possibilityKey of Object.keys(fileContent.possibilities)) {
        for (const possibility of fileContent.possibilities[possibilityKey]) {
          let possibilityContent = {
            possibilityKey: possibilityKey,
            lostTime: possibility.lostTime,
            health: possibility.health,
            effect: possibility.effect,
            experience: possibility.experience,
            money: possibility.money,
            item: possibility.item,
            fr: possibility.translations.fr,
            en: possibility.translations.en,
            event_id: fileName,
          };
          possibilitiesContent.push(possibilityContent);
        }
      }
    }

    await Events.bulkCreate(eventsContent);
    await Possibilities.bulkCreate(possibilitiesContent);
  }

  /**
   * @return {Promise<void>}
   */
  static async setEverybodyAsUnOccupied() {
    Entities.update({
      effect: EFFECT.SMILEY
    }, {
      where: {
        effect: EFFECT.AWAITINGANSWER
      }
    });
  }

}

module.exports = {
  init: Database.init,
};
