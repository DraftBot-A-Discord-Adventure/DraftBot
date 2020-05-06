const fs = require('fs');
const Sequelize = require('sequelize');

class Database {

  /**
   * @return {Promise<void>}
   */
  static async init() {
    Database.models = new Map();

    const sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: 'database/database.sqlite',
      logging: false
    });

    let modelsFiles = await fs.promises.readdir('src/core/models');
    for (let modelFile of modelsFiles) {
      let modelName = modelFile.split('.')[0];

      let model = sequelize['import'](`models/${modelName}`);
      Database.models.set(
          modelName.toLowerCase(),
          model
      );
    }
  }

  /**
   * @param {String} model - The model to get
   * @return An instance of the model asked
   */
  static getModel(model) {
    return Database.models.get(model);
  }

}

module.exports = {
  init: Database.init,
};

global.getModel = Database.getModel;
