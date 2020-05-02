const ItemAbstract = require("entities/ItemAbstract");

/**
 * @property {Number} id
 * @property {Number} rarity
 * @property {Number} power
 * @property {Object} translations
 * @property {String} translations.fr
 * @property {String} translations.en
 * @property {Number} nature
 */
class D_Object extends ItemAbstract {

    /**
     * @param {Number} id
     * @param {Number} rarity
     * @param {Number} power
     * @param {Object} translations
     * @param {String} translations.fr
     * @param {String} translations.en
     * @param {Number} nature
     */
    constructor({id, rarity, power, translations, nature}) {
        super({id, rarity, power, translations});
        this.nature = nature;
    }

    /**
     * Return an object of object for display purposes
     * @param {("fr"|"en")} language - The language the object has to be displayed in
     * @param {("active"|"backup")} slot - The slot of the object
     * @returns {Object}
     */
    toFieldObject(language, slot) {
        return {
            name: JsonReader.entities.d_object.getTranslation(language)[slot].fieldName,
            value: (this.id === 0) ? this.getTranslation(language) : format(
                JsonReader.entities.d_object.getTranslation(language)[slot].fieldValue, {
                    name: this.getTranslation(language),
                    nature: this.getNatureTranslation(language),
                    rarity: this.getRarityTranslation(language),
                }),
        };
    }

    /**
     * Return the nature translation of the potion
     * @param {("fr"|"en")} language
     * @returns {String}
     */
    getNatureTranslation(language) {
        return format(JsonReader.entities.d_object.getTranslation(language).natures[this.nature], {power: this.power});
    }

}

module.exports = D_Object;
