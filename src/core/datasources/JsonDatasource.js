const fs = require('fs');

class JsonDatasource {

  /**
   * @return {Promise<JsonDatasource>}
   */
  static async init() {
    if (JsonDatasource._instance) {
      return JsonDatasource._instance;
    }
    JsonDatasource._instance = JsonDatasource;
    return JsonDatasource._instance;
  }

  /**
   * @param {String} folder
   * @return {Promise<void>}
   */
  static async loadJsons(folder) {
    let files = await fs.promises.readdir(`ressources/text/${folder}`);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      let fileName = file.split('.')[0];
      if (JsonDatasource[folder] === undefined) {
        JsonDatasource[folder] = {};
      }
      JsonDatasource[folder][fileName] = (require(
          `ressources/text/${folder}/${file}`));
    }
    return JsonDatasource[folder];
  }

}

module.exports = {
  init: JsonDatasource.init,
};
