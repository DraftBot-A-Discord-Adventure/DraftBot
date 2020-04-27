const RepositoryAbstract = require("repositories/RepositoryAbstract");
const Object = require("entities/Object");

class ObjectRepository extends RepositoryAbstract {

    /**
     * Return default object
     * @return {Promise<Object>}
     */
    async getDefaultObject() {
        return new Object(
            "default",
            this.text.items.object.default.rareness,
            this.text.items.object.default.power,
            this.text.items.object.default.translations,
            this.text.items.object.default.nature
        );
    }

    /**
     * Return an object by id
     * @param {number} id
     * @return {Promise<Object>}
     */
    async getObjectById(id) {
        return new Object(
            id,
            this.text.items.object[id].rareness,
            this.text.items.object[id].power,
            this.text.items.object[id].translations,
            this.text.items.object[id].nature
        );
    }

    /**
     * Choose a random object in the existing ones. (take care of the rareness)
     * @return {Promise<Object>}
     */
    async getRandomObjectWithRareness() {
        const desiredRareness = Tools.generateRandomRareness();
        const possibleObjects = Object.entries(this.text.items.object).filter(key => parseInt(this.text.items.object[key[0]].rareness) === desiredRareness);
        const id = possibleObjects[Math.floor(Math.random() * possibleObjects.length)][0];
        return new Object(
            id,
            this.text.items.object[id].rareness,
            this.text.items.object[id].power,
            this.text.items.object[id].translations,
            this.text.items.object[id].nature
        );
    }

    /**
     * Choose a object totally randomly without taking care of the rareness
     * @return {Promise<Object>}
     */
    async getRandomObject() {
        const id = Math.round(Math.random() * (Config.raritiesGenerator.numberOfObject - 1)) + 1; // TODO Config.raritiesGenerator.numberOfObject peut etre remplacé par length - 1 du nbr de objet ?
        return new Object(
            id,
            this.text.items.object[id].rareness,
            this.text.items.object[id].power,
            this.text.items.object[id].translations,
            this.text.items.object[id].nature
        );
    }

}

module.exports = ObjectRepository;
