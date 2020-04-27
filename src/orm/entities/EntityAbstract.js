class EntityAbstract {

    constructor() {
        if (this.constructor === EntityAbstract) {
            throw new Error("Abstract class EntityAbstract cannot be instantiated directly");
        }
    }

    /**
     * @param {string} field
     * @return {*} value
     * @throws {Error}
     */
    get(field) {
        if (field in this === undefined) {
            throw new Error("This field doesn't exist in class property");
        }

        return this[field];
    }

    /**
     * @param {string} field
     * @param {*} value
     * @throws {Error}
     */
    set(field, value) {
        if (field in this === undefined) {
            throw new Error();
        }

        this[field] = value;
    }

}

module.exports = EntityAbstract;
