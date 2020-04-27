class RepositoryAbstract {

    constructor(sql, text) {

        if (this.constructor === RepositoryAbstract) {
            throw new Error("Abstract class RepositoryAbstract cannot be instantiated directly");
        }

        this.sql = sql;
        this.text = text;
    }

}

module.exports = RepositoryAbstract;
