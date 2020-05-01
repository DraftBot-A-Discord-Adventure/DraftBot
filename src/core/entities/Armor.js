const ItemAbstract = require("entities/ItemAbstract");

class Armor extends ItemAbstract {

    constructor(id, rareness, power, translations, effect) {
        super(id, rareness, power, translations);
        this.effect = effect;
    }

    /**
     * Return string containing a description of an armor
     * @param {string} language - The language the object has to be displayed in
     * @returns {Object[]}
     */
    toEmbedObject(language) {
        return [{
            name: Config.text[language].commands.inventory.armorTitle,
            value: (this.id === "default") ? this.getTranslation(language) : this.getTranslation(language) + Config.text[language].equipementManager.separator1 + this.get('effect') + Config.text[language].equipementManager.separator2 + Config.text[language].rarities[this.get('rareness')],
            inline:  false
        }];
    }

}

module.exports = Armor;
