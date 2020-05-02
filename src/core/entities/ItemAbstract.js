const EntityAbstract = require("entities/EntityAbstract");

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
     * Returns a string containing a description of the item
     * @param {String} language - The language the item has to be displayed in
     * @returns {String}
     */
    display(language) {
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

    /**
     * TODO 2.0 Utilité de cette fonction ? (utile au poition seulement ?)
     * Get the emoji
     * @returns {String}
     */
    getEmoji() {
        return this.getTranslation('en').split(" ")[0];
    }
}

module.exports = ItemAbstract;
