const ItemAbstract = require("entities/ItemAbstract");

class Weapon extends ItemAbstract {

    constructor({id, rarity, power, translations, effect}) {
        super({id, rarity, power, translations});
        this.effect = JsonReader.effect[this.rarity][this.power];
    }

    /**
     * TODO 2.0 Refactor
     * Return string containing a description of an weapon
     * @param {string} language - The language the object has to be displayed in
     * @returns {string}
     */
    display(language) {
        let result = this.getTranslation(language);
        result += Config.text[language].equipementManager.separator1;
        result += this.get('effect');
        result += Config.text[language].equipementManager.separator2;
        result += Config.text[language].rarities[this.get('rarity')];

        return result;
    }

    /**
     * TODO 2.0 Rename : Je ne comprend pas trop cette fonction = (real power)
     * Return the realPower of the item (only for weapon / armors)
     * @returns {number}
     */
    getvalue() {
        return parseInt(Config.raritiesValues[this.get('rarity')]) + parseInt(this.get('power'));
    }

}

module.exports = Weapon;
