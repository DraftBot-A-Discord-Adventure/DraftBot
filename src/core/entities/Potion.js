const ItemAbstract = require("entities/ItemAbstract");

/**
 * @propery {Number} id
 * @propery {Number} rarity
 * @propery {Object} translations
 * @propery {String} translations.fr
 * @propery {String} translations.en
 * @propery {Number} rawAttack
 * @propery {Number} attack
 * @propery {Number} rawDefense
 * @propery {Number} defense
 * @propery {Number} rawSpeed
 * @propery {Number} speed
 * @propery {Number} nature
 * @propery {Number} power
 */
class Potion extends ItemAbstract {

    /**
     * @param {Number} id
     * @param {Number} rarity
     * @param {Object} translations
     * @param {String} translations.fr
     * @param {String} translations.en
     * @param {Number} rawAttack
     * @param {Number} attack
     * @param {Number} rawDefense
     * @param {Number} defense
     * @param {Number} rawSpeed
     * @param {Number} speed
     * @param {Number} nature
     * @param {Number} power
     */
    constructor({id, rarity, translations, rawAttack, attack, rawDefense, defense, rawSpeed, speed, nature, power}) {
        super({id, rarity, translations, rawAttack, attack, rawDefense, defense, rawSpeed, speed});
        this.power = power;
        this.nature = nature;
    }

    /**
     * Return an object of potion for display purposes
     * @param {("fr"|"en")} language - The language the object has to be displayed in
     * @returns {Object}
     */
    toFieldObject(language) {
        return {
            name: JsonReader.entities.potion.getTranslation(language).fieldName,
            value: (this.id === 0) ? this.getTranslation(language) : format(
                JsonReader.entities.potion.getTranslation(language).fieldValue, {
                    name: this.getTranslation(language),
                    rarity: this.getRarityTranslation(language),
                    nature: this.getNatureTranslation(language),
                }),
        };
    }

    /**
     * Return the nature translation of the potion
     * @param {("fr"|"en")} language
     * @returns {String}
     */
    getNatureTranslation(language) {
        return format(JsonReader.entities.potion.getTranslation(language).natures[this.nature], {power: this.power});
    }

    /**
     * @return {Number}
     */
    getAttack() {
        if (this.nature === 3)
            return this.power;

        return 0;
    }

    /**
     * @return {Number}
     */
    getDefense() {
        if (this.nature === 4)
            return this.power;

        return 0;
    }

    /**
     * @return {Number}
     */
    getSpeed() {
        if (this.nature === 2)
            return this.power;

        return 0;
    }

}

module.exports = Potion;
