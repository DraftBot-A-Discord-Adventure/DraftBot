const ItemAbstract = require("entities/ItemAbstract");

class Armor extends ItemAbstract {

    /**
     * @param {Number} id
     * @param {Number} rarity
     * @param {Number} power
     * @param {Object} translations
     * @param {String} translations.fr
     * @param {String} translations.en
     * @param {Number} effect
     */
    constructor({id, rarity, power, translations, effect}) {
        super({id, rarity, power, translations});
        this.effect = JsonReader.effect[this.rarity][this.power];
    }

    /**
     * TODO 2.0 Refactor
     * Return string containing a description of an armor
     * @param {string} language - The language the object has to be displayed in
     * @returns {Object[]}
     */
    toEmbedObject(language) {
        return [{
            name: Config.text[language].commands.inventory.armorTitle,
            value: (this.id === "default") ? this.getTranslation(language) : this.getTranslation(language) + Config.text[language].equipementManager.separator1 + this.get('effect') + Config.text[language].equipementManager.separator2 + Config.text[language].rarities[this.get('rarity')],
            inline:  false
        }];
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

module.exports = Armor;
