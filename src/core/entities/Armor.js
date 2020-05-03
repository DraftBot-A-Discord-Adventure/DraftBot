const ItemAbstract = require('entities/ItemAbstract');

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
 */
class Armor extends ItemAbstract {

  /**
   * Return an object of weapon for display purposes
   * @param {("fr"|"en")} language - The language the object has to be displayed in
   * @returns {Object}
   */
  toFieldObject(language) {
    return {
      name: JsonReader.entities.armor.getTranslation(language).fieldName,
      value: (this.id === 0) ? this.getTranslation(language) : format(
          JsonReader.entities.d_object.getTranslation(language).fieldValue, {
            name: this.getTranslation(language),
            rarity: this.getRarityTranslation(language),
            values: this.getValues(language),
          }),
    };
  }

}

module.exports = Armor;
