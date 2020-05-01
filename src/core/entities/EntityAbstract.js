class EntityAbstract {

  constructor() {
    if (this.constructor === EntityAbstract) {
      throw new Error(
          'Abstract class EntityAbstract cannot be instantiated directly');
    }
  }

}

module.exports = EntityAbstract;
