const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const fs = require('fs');

class Repository {

  async init() {
    this.sql = await sqlite.open({
      filename: 'database/database.sqlite',
      driver: sqlite3.cached.Database,
    });

    this.text = {
      events: {},
      weapons: {},
      armors: {},
      potions: {},
      objects: {},
    };
    await this.loadFiles();

    await fs.promises.readdir('src/orm/repositories').then(files => {
      files.forEach(file => {
        if (!file.endsWith('.js')) return;
        if (file.endsWith('Abstract.js')) return;
        let repositoryName = file.split('.')[0];
        draftbot.repositories.set(
            repositoryName.split('Repository')[0].toLowerCase(),
            new (require(`repositories/${repositoryName}`))(this.sql, this.text),
        );
      });
    }).catch(console.error);

    await this.checkDatabaseMigrations();
    await this.setEverybodyAsUnOccupied();
  }

  /**
   * @return {Promise<void>}
   */
  async loadFiles() {
    const folders = await Object.keys(this.text);
    for (const folder of folders) {
      let files = await fs.promises.readdir(`ressources/text/${folder}`);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        let fileName = file.split('.')[0];
        this.text[folder][fileName] = (require(`text/${folder}/${file}`));
      }
    }
  }

  /**
   * This function analyses the passed database and check if it is valid.
   */
  async checkDatabaseMigrations() {
    await this.sql.migrate({
      migrationsPath: 'database/migrations',
    }).catch(console.error);
  }

  /**
   * Allow to set the state of all the player to normal in order to allow them to play
   */
  async setEverybodyAsUnOccupied() {
    await this.sql.run(`UPDATE entity SET effect = ? WHERE effect = ?`,
        ':smiley:', ':clock10:').catch(console.error);
  }

}

module.exports = Repository;
