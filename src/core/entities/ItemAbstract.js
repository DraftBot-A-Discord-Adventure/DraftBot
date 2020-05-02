const EntityAbstract = require("entities/EntityAbstract");

/**
 * @property {Number} id
 * @property {Number} rarity
 * @property {Number} power
 * @property {Object} translations
 * @property {String} translations.fr
 * @property {String} translations.en
 */
class ItemAbstract extends EntityAbstract {

    /**
     * @param {Number} id
     * @param {Number} rarity
     * @param {Number} power
     * @param {Object} translations
     * @param {String} translations.fr
     * @param {String} translations.en
     */
    constructor({id, rarity, power, translations}) {
        super();
        if (this.constructor === ItemAbstract) {
            throw new Error("Abstract class ItemAbstract cannot be instantiated directly");
        }

        this.id = id;
        this.rarity = rarity;
        this.power = power;
        this.translations = translations;
    }

    /**
     * @param {("fr"|"en")} language
     * @return {Object}
     */
    getTranslation(language) {
        return this.translations[language];
    }

    /**
     * Return an object display purposes
     * @param {("fr"|"en")} language - The language the object has to be displayed in
     * @returns {Object}
     */
    toFieldObject(language) {
        throw new Error('You must implement this function');
    }

    /**
     * Returns the rarity translation of the item
     * @param {("fr"|"en")} language
     * @returns {String}
     */
    getRarityTranslation(language) {
        return JsonReader.entities.item.getTranslation(language).rarities[this.rarity];
    }

}

module.exports = ItemAbstract;
