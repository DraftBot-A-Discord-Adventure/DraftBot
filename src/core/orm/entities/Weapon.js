const ItemAbstract = require("entities/ItemAbstract");

class Weapon extends ItemAbstract {

    constructor(id, rareness, power, translations, effect) {
        super(id, rareness, power, translations);
        this.effect = effect;
    }

    /**
     * Return string containing a description of an weapon
     * @param {string} language - The language the object has to be displayed in
     * @returns {string}
     */
    display(language) {
        let result = this.getTranslation(language);
        result += Config.text[language].equipementManager.separator1;
        result += this.get('effect');
        result += Config.text[language].equipementManager.separator2;
        result += Config.text[language].rarities[this.get('rareness')];

        return result;
    }

}

module.exports = Weapon;
