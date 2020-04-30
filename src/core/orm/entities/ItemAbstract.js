const EntityAbstract = require("entities/EntityAbstract");

class ItemAbstract extends EntityAbstract {

    constructor(id, rareness, power, translations) {
        super();

        if (this.constructor === ItemAbstract) {
            throw new Error("Abstract class ItemAbstract cannot be instantiated directly");
        }

        this.id = id;
        this.rareness = rareness;
        this.power = power;
        this.translations = translations;
    }

    /**
     * Return the name of the potion
     * @param {string} language
     * @return {string}
     */
    getTranslation(language) {
        return this.translations[language];
    }

    /**
     * Get the emoji that correspond to the potion
     * @returns {string}
     */
    getEmoji() {
        return this.getTranslation('en').split(" ")[0];
    }

    /**
     * Return the value of the item
     * @returns {number}
     */
    getValue() {
        return parseInt(Config.raritiesValues[this.get('rareness')]) + parseInt(this.get('power')); // TODO J'ai du mal à voir l'utilité de cette value ?! Peux etre le nom a revoir ?
    }
}

module.exports = ItemAbstract;
