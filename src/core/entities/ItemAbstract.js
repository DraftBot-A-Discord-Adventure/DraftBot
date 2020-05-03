const EntityAbstract = require('entities/EntityAbstract');

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
class ItemAbstract extends EntityAbstract {

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
   * @param {Number} rawMaxHealth
   * @param {Number} maxHealth
   * @param {Number} rawHealth
   * @param {Number} health
   * @param {Number} rawMaxHealthInFight
   * @param {Number} maxHealthInFight
   * @param {Number} rawExperience
   * @param {Number} experience
   * @param {Number} rawMoney
   * @param {Number} money
   * @param {Number} nature
   */
  constructor({id, rarity, translations, rawAttack, attack, rawDefense, defense, rawSpeed, speed}) {
    super();
    if (this.constructor === ItemAbstract) {
      throw new Error(
          'Abstract class ItemAbstract cannot be instantiated directly');
    }

    this.id = id;
    this.rarity = rarity;
    this.translations = translations;
    this.rawAttack = rawAttack || 0;
    this.attack = attack || 0;
    this.rawDefense = rawDefense || 0;
    this.defense = defense || 0;
    this.rawSpeed = rawSpeed || 0;
    this.speed = speed || 0;
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
    return JsonReader.entities.item.getTranslation(
        language).rarities[this.rarity];
  }

  /**
   * Return the property from rawProperty and property modifier
   * @returns {Number}
   */
  getAttack() {
    return JsonReader.power[this.rarity][this.rawAttack] + this.attack;
  }

  /**
   * Return the property from rawProperty and property modifier
   * @returns {Number}
   */
  getDefense() {
    return JsonReader.power[this.rarity][this.rawDefense] + this.defense;
  }

  /**
   * Return the property from rawProperty and property modifier
   * @returns {Number}
   */
  getSpeed() {
    return JsonReader.power[this.rarity][this.rawSpeed] + this.speed;
  }

  getValues(language) {
    let values = [];

    if (this.getAttack() !== 0) {
      values.push(format(JsonReader.entities.d_object.getTranslation(language).attack, {
        attack: this.getAttack()
      }));
    }

    if (this.getDefense() !== 0) {
      values.push(format(JsonReader.entities.d_object.getTranslation(language).defense, {
        defense: this.getDefense()
      }));
    }

    if (this.getSpeed() !== 0) {
      values.push(format(JsonReader.entities.d_object.getTranslation(language).speed, {
        speed: this.getSpeed()
      }));
    }

    return values.join(' ');
  }

}

module.exports = ItemAbstract;
