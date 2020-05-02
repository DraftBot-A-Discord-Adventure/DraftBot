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
  }

  /**
   * @param {String} repository - The repository to get
   * @return An instance of the repository asked
   */
  static getRepository(repository) {
    return Repository.repositories.get(repository);
  }

}

module.exports = {
  init: Repository.init,
};

global.getRepository = Repository.getRepository;
