const fs = require('fs');

class Repository {

  /**
   * @return {Promise<void>}
   */
  static async init() {
    Repository.repositories = new Map();

    let repositoriesFiles = await fs.promises.readdir('src/core/repositories');
    for (const repositoryFile of repositoriesFiles) {
      if (!repositoryFile.endsWith('.js')) continue;
      if (repositoryFile === 'AppRepository.js') continue;
      let repositoryName = repositoryFile.split('.')[0];

      let instanceOfRepository = new (require(`repositories/${repositoryName}`))();
      await instanceOfRepository.init();

      await Repository.repositories.set(
          repositoryName.split('Repository')[0].toLowerCase(),
          instanceOfRepository
      );
    }

    // await this.checkDatabaseMigrations();
    // await this.setEverybodyAsUnOccupied();
  }

  /**
   * @param {String} repository - The repository to get
   * @return An instance of the repository asked
   */
  static getRepository(repository) {
    return Repository.repositories.get(repository);
  }

  //
  // /**
  //  * This function analyses the passed database and check if it is valid.
  //  */
  // async checkDatabaseMigrations() {
  //   await this.sql.migrate({
  //     migrationsPath: 'database/migrations',
  //   }).catch(console.error);
  // }
  //
  // /**
  //  * TODO 2.0 Call entityRepository
  //  * Allow to set the state of all the player to normal in order to allow them to play
  //  */
  // async setEverybodyAsUnOccupied() {
  //   await this.sql.run(`UPDATE entity SET effect = ? WHERE effect = ?`,
  //       ':smiley:', ':clock10:').catch(console.error);
  // }

}

module.exports = {
  init: Repository.init,
};

global.getRepository = Repository.getRepository;
