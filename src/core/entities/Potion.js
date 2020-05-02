const ItemAbstract = require("entities/ItemAbstract");

class Potion extends ItemAbstract {

    constructor({id, rarity, power, translations, nature}) {
        super({id, rarity, power, translations});
        this.nature = nature;
    }

    /**
     * Returns a string containing a description of the item
     * @param {String} language - The language the item has to be displayed in
     * @returns {String}
     */
    display(language) {
        if (this.id === 0) {
            return this.getTranslation(language);
        }
        return format(JsonReader.entities.potion.getTranslation(language).display, {
            itemName: this.getTranslation(language),
            rarity: this.getRarityTranslation(language),
            nature: format(JsonReader.entities.potion.getTranslation(language).natures[this.nature], {power: this.power})
        });
    }
}

module.exports = Potion;
