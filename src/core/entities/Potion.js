const ItemAbstract = require("entities/ItemAbstract");

class Potion extends ItemAbstract {

    constructor({id, rarity, power, translations, nature}) {
        super({id, rarity, power, translations});
        this.nature = nature;
    }

    /**
     * TODO 2.0 Refactor
     * Return string containing a description of an potion
     * @param {string} language - The language the object has to be displayed in
     * @returns {string}
     */
    display(language) {
        let result = this.getTranslation(language);

        if (this.get('id') === 'default') {
            return result;
        }

        result += Config.text[language].potionManager.separator;
        result += Config.text[language].rarities[this.get('rarity')];
        result += Config.text[language].potionManager.separator;
        result += Config.text[language].nature.intro[this.get('nature')];

        if (this.get('nature') !== "0") {
            result += this.get('power') + Config.text[language].nature.outroPotion[this.get('nature')];
        }

        return result;
    }

}

module.exports = Potion;
