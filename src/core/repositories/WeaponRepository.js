const AppRepository = require("repositories/AppRepository");
const Weapon = require("entities/Weapon");

/**
 * @property {String} datasource
 * @property {Object} weapons
 */
class WeaponRepository extends AppRepository {

    constructor() {
        super();
        this.datasource = DATASOURCE.JSON;
    }

    /**
     * Return a weapon by id
     * @param {number} id
     * @return {Promise<Weapon>}
     */
    async getById(id) {
        return this.weapons[id];
    }

    /**
     * Choose a random weapon in the existing ones. (take care of the rarity)
     * @return {Promise<Weapon>}
     */
    async getRandomWithRarity() {
        const desiredRarity = generateRandomRarity();
        const possibleWeapons = Object.entries(this.weapons).filter(key => this.weapons[key[0]].rarity === desiredRarity);
        const id = possibleWeapons[Math.floor(Math.random() * possibleWeapons.length)][0];
        return this.weapons[id];
    }

}

module.exports = WeaponRepository;
