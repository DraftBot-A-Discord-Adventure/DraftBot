const RepositoryAbstract = require("repositories/RepositoryAbstract");
const Armor = require("entities/Armor");

class ArmorRepository extends RepositoryAbstract {

    /**
     * Return default armor
     * @return {Promise<Armor>}
     */
    async getDefaultArmor() {
        return new Armor(
            "default",
            this.text.items.armor.default.rareness,
            this.text.items.armor.default.power,
            this.text.items.armor.default.translations,
            this.text.items.effect[this.text.items.armor.default.rareness][this.text.items.armor.default.power]
        );
    }

    /**
     * Return an armor by id
     * @param {number} id
     * @return {Promise<Armor>}
     */
    async getArmorById(id) {
        return new Armor(
            id,
            this.text.items.armor[id].rareness,
            this.text.items.armor[id].power,
            this.text.items.armor[id].translations,
            this.text.items.effect[this.text.items.armor[id].rareness][this.text.items.armor[id].power]
        );
    }

    /**
     * Choose a random armor in the existing ones. (take care of the rareness)
     * @return {Promise<Armor>}
     */
    async getRandomArmorWithRareness() {
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
    async getRandomArmor() {
        const id = Math.round(Math.random() * (Config.raritiesGenerator.numberOfArmor - 1)) + 1; // TODO Config.raritiesGenerator.numberOfArmor peut etre remplacé par length - 1 du nbr d'armor ?
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
