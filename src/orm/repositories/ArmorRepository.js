const RepositoryAbstract = require("repositories/RepositoryAbstract");
const Armor = require("entities/Armor");

class ArmorRepository extends RepositoryAbstract {

    /**
     * Return an armor by id
     * @param {number|String} id
     * @return {Promise<Armor>}
     */
    async getById(id) {

        console.log(this.text.armors[0]);

        return new Armor(
            id,
            this.text.armors[id].rareness,
            this.text.armors[id].power,
            this.text.armors[id].translations,
            0 //this.text.items.effect[this.text.items.armor[id].rareness][this.text.items.armor[id].power]
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
