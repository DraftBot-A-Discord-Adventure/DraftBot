const AppRepository = require("repositories/AppRepository");
const Armor = require("entities/Armor");

class ArmorRepository extends AppRepository {

    constructor() {
        super();
        this.datasource = DATASOURCE.JSON;
    }

    /**
     * Return an armor by id
     * @param {number} id
     * @return {Promise<Armor>}
     */
    async getById(id) {
        return new Armor(
            id,
            this.armors[id].rareness,
            this.armors[id].power,
            this.armors[id].translations,
            JsonReader.effect[this.armors[id].rareness][this.armors[id].power]
        );
    }

    /**
     * Choose a random armor in the existing ones. (take care of the rareness)
     * @return {Promise<Armor>}
     */
    async getRandomWithRareness() {
        const desiredRareness = Tools.generateRandomRareness();
        const possibleArmors = Object.entries(this.text.items.armor).filter(key => parseInt(this.text.items.armor[key[0]].rareness) === desiredRareness);
        const id = possibleArmors[Math.floor(Math.random() * possibleArmors.length)][0];
        return new Armor(
            id,
            this.text.items.armor[id].rareness,
            this.text.items.armor[id].power,
            this.text.items.armor[id].translations,
            this.text.items.effect[this.text.items.armor[id].rareness][this.text.items.armor[id].power]
        );
    }


    /**
     * Choose a armor totally randomly without taking care of the rareness
     * @return {Promise<Armor>}
     */
    async getRandom() {
        const id = Math.round(Math.random() * (Config.raritiesGenerator.numberOfArmor - 1)) + 1;
        return new Armor(
            id,
            this.text.items.armor[id].rareness,
            this.text.items.armor[id].power,
            this.text.items.armor[id].translations,
            this.text.items.effect[this.text.items.armor[id].rareness][this.text.items.armor[id].power]
        );
    }

}

module.exports = ArmorRepository;
