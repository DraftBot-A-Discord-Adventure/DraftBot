const ItemAbstract = require("entities/ItemAbstract");

class Weapon extends ItemAbstract {

    constructor({id, rarity, power, translations, effect}) {
        super({id, rarity, power, translations});
        this.effect = JsonReader.effect[this.rarity][this.power];
    }

    /**
     * Returns a string containing a description of the item
     * @param {String} language - The language the item has to be displayed in
     * @returns {String}
     */
    display(language) {
        if (this.id === 0) {
            return this.getTranslation(language);
        }
        return format(JsonReader.entities.weapon.getTranslation(language).display, {itemName: this.getTranslation(language), power: this.power, rarity: this.getRarityTranslation(language)});
    }

    /**
     * TODO 2.0 Rename : Je ne comprend pas trop cette fonction = (real power)
     * Return the realPower of the item (only for weapon / armors)
     * @returns {Number}
     */
    getvalue() {
        return parseInt(Config.raritiesValues[this.get('rarity')]) + parseInt(this.get('power'));
    }

}

module.exports = Weapon;
