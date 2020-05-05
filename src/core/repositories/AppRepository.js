/**
 * @property {String} datasource
 * @property {Object[]} _resultsSet
 * @property {String} _primaryKey
 */
class AppRepository {

  constructor() {
    // this._resultsSet = {};
    // this._resultsSet[this.constructor.name] = [];
    // this.associations = [];
  }

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

  // TODO 2.x need some debug en takes care of primaryKey and foreignKey
  // contain([...associations]) {
  //   this.associations = associations;
  //   for (const association of associations) {
  //     if (association.includes('.')) {
  //       let joinLeft = association.substring(0, association.indexOf('.'));
  //       let joinRight = association.substring(association.indexOf('.') + 1);
  //
  //       if (typeof this[joinLeft] !== 'function') {
  //         throw new Error(`Association ${joinLeft} not exist in ${this.constructor.name}`);
  //       }
  //       this[joinLeft]();
  //       getRepository(joinLeft).contain([joinRight]);
  //     } else {
  //       if (typeof this[association] !== 'function') {
  //         throw new Error(`Association ${association} not exist in ${this.constructor.name}`);
  //       }
  //       this[association]();
  //     }
  //   }
  //   return this;
  // }
  //
  // async get() {
  //   let key = this.constructor.name;
  //   let keyName = key.slice(0, -10).toLowerCase();
  //   let entityName = keyName.charAt(0).toUpperCase() + keyName.slice(1);
  //
  //   let res = await this._resultsSet[key].pop();
  //   let result = new (require(`entities/${entityName}`))(res);
  //
  //   for (const association of this.associations) {
  //     if (association.includes('.')) {
  //       let joinLeft = association.substring(0, association.indexOf('.'));
  //       res = await getRepository(joinLeft).get();
  //       result[`_${joinLeft}`] = res;
  //     } else {
  //       res = await getRepository(association).get();
  //       result[`_${association}`] = new (require(`entities/${association}`))(res);
  //     }
  //   }
  //
  //   return result;
  // }

}

module.exports = AppRepository;
