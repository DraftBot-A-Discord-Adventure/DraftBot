const fs = require('fs');
const Sequelize = require('sequelize');

class Database {

  /**
   * @return {Promise<void>}
   */
  static async init() {
    const sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: 'database/database.sqlite',
      logging: false
    });

    let modelsFiles = await fs.promises.readdir('src/core/models');
    for (let modelFile of modelsFiles) {
      let modelName = modelFile.split('.')[0];
      global[modelName] = sequelize['import'](`models/${modelName}`);
    }
  }

}

module.exports = {
  init: Database.init,
};
