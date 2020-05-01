/**
 * @property {String} datasource
 */
class AppRepository {

  /**
   * @return {Promise<void>}
   */
  async init() {
    if (this.datasource === 'sqlite') {
      this.sql = (await (require('datasources/SqliteDatasource')).init()).sql;
    }
    if (this.datasource === 'json') {
      let jsonName = this.constructor.name.split('Repository')[0].toLowerCase() + 's';
      if (jsonName === 'possibilitys') {
        jsonName = 'events';
      }
      this[jsonName] = await (await (require('datasources/JsonDatasource')).init()).loadJsons(jsonName);
    }
  }

}

module.exports = AppRepository;

// Defines allowed datasource
global.DATASOURCE = {
  SQLITE: "sqlite",
  JSON: "json"
};
