const AppRepository = require("repositories/AppRepository");
const Potion = require("entities/Potion");

/**
 * @property {String} datasource
 * @property {Object} potions
 */
class PotionRepository extends AppRepository {

    constructor() {
        super();
        this.datasource = DATASOURCE.JSON;
    }

    /**
     * Return an potion by id
     * @param {number} id
     * @return {Promise<Potion>}
     */
    async getById(id) {
        return this.potions[id];
    }

    /**
     * Choose a random potion in the existing ones. (take care of the rarity)
     * @return {Promise<Potion>}
     */
    async getRandomWithRarity() {
        const desiredRarity = generateRandomRarity();
        const possiblePotions = Object.entries(this.potions).filter(key => this.potions[key[0]].rarity === desiredRarity);
        const id = possiblePotions[Math.floor(Math.random() * possiblePotions.length)][0];
        return this.potions[id];
    }

}

module.exports = PotionRepository;
