class Entity {

    /**
     * @param {string} field
     * @return {*} value
     * @throws {Error}
     */
    get(field) {
        if (field in this === undefined) {
            throw new Error();
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

module.exports = Entity;
