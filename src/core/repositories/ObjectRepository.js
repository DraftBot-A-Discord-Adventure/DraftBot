const AppRepository = require("repositories/AppRepository");
const D_Object = require("entities/D_Object");

/**
 * @property {String} datasource
 * @property {Object} objects
 */
class ObjectRepository extends AppRepository {

    constructor() {
        super();
        this.datasource = DATASOURCE.JSON;
    }

    /**
     * Return an object by id
     * @param {Number} id
     * @return {Promise<Object>}
     */
    async getById(id) {
        return this.objects[id];
    }

    /**
     * Choose a random object in the existing ones. (take care of the rarity)
     * @return {Promise<Object>}
     */
    async getRandomWithRarity() {
        const desiredRarity = generateRandomRarity();
        const possibleObjects = Object.entries(this.objects).filter(key => this.object[key[0]].rarity === desiredRarity);
        const id = possibleObjects[Math.floor(Math.random() * possibleObjects.length)][0];
        return this.objects[id];
    }

}

module.exports = ObjectRepository;
