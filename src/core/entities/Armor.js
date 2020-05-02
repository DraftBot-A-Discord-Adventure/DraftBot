const ItemAbstract = require('entities/ItemAbstract');

/**
 * @property {Number} id
 * @property {Number} rarity
 * @property {Number} power
 * @property {Object} translations
 * @property {String} translations.fr
 * @property {String} translations.en
 * @property {Number} effect
 */
class Armor extends ItemAbstract {

  /**
   * @param {Number} id
   * @param {Number} rarity
   * @param {Number} power
   * @param {Object} translations
   * @param {String} translations.fr
   * @param {String} translations.en
   * @param {Number} effect
   */
  constructor({id, rarity, power, translations, effect}) {
    super({id, rarity, power, translations});
    this.effect = JsonReader.effect[this.rarity][this.power];
  }

  /**
   * Return an object of weapon for display purposes
   * @param {("fr"|"en")} language - The language the object has to be displayed in
   * @returns {Object}
   */
  toFieldObject(language) {
    return {
      name: JsonReader.entities.armor.getTranslation(language).fieldName,
      value: (this.id === 0) ? this.getTranslation(language) : format(
          JsonReader.entities.armor.getTranslation(language).fieldValue, {
            name: this.getTranslation(language),
            defense: this.getDefense(),
            rarity: this.getRarityTranslation(language),
          }),
    };
  }

  /**
   * Return the realPower of the armor
   * @returns {Number}
   */
  getDefense() {
    return JsonReader.effect[this.rarity][this.power];
  }

}

module.exports = Armor;
