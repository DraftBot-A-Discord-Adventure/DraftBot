class RepositoryAbstract {

  constructor() {
    if (this.constructor === RepositoryAbstract) {
      throw new Error(`Abstract class ${this.constructor.name} cannot be instantiated directly`);
    }
  }

}

module.exports = RepositoryAbstract;
