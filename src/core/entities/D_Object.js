const ItemAbstract = require("entities/ItemAbstract");

class D_Object extends ItemAbstract {

    constructor({id, rarity, power, translations, nature}) {
        super({id, rarity, power, translations});
        this.nature = nature;
    }

    /**
     * TODO 2.0 Refactor
     * Return string containing a description of an object
     * @param {String} language - The language the object has to be displayed in
     * @returns {String}
     */
    display(language) {
        let result = this.getTranslation(language);

        if (this.get('id') === 'default') {
            return result;
        }

        result += Config.text[language].objectManager.separator;
        result += Config.text[language].rarities[this.get('rarity')];
        result += Config.text[language].objectManager.separator;
        result += Config.text[language].nature.intro[this.get('nature')];

        if (this.get('nature') !== "0") {
            result += this.get('power') + Config.text[language].nature.outroObject[this.get('nature')];
        }

        return result;
    }

}

module.exports = D_Object;
