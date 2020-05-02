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
class Weapon extends ItemAbstract {

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
      name: JsonReader.entities.weapon.getTranslation(language).fieldName,
      value: (this.id === 0) ? this.getTranslation(language) : format(
          JsonReader.entities.weapon.getTranslation(language).fieldValue, {
            name: this.getTranslation(language),
            attack: this.getAttack(),
            rarity: this.getRarityTranslation(language),
          }),
    };
  }

  /**
   * Return the realPower of the weapon
   * @returns {Number}
   */
  getAttack() {
    return JsonReader.effect[this.rarity][this.power];
  }

}

module.exports = Weapon;
