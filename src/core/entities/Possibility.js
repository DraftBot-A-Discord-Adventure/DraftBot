const EntityAbstract = require('entities/EntityAbstract');

/**
 * @property {Number} eventId
 * @property {String} emoji
 * @property {Number} id
 * @property {Object} translations
 * @property {String} translations.fr
 * @property {String} translations.en
 * @property {Number} lostTime
 * @property {Number} health
 * @property {String} effect
 * @property {Number} experience
 * @property {Number} money
 * @property {Boolean} item
 */
class Possibility extends EntityAbstract {

  /**
   * @param {Number} eventId
   * @param {String} emoji
   * @param {Number} id
   * @param {Object} translations
   * @param {String} translations.fr
   * @param {String} translations.en
   * @param {Number} lostTime
   * @param {Number} health
   * @param {String} effect
   * @param {Number} experience
   * @param {Number} money
   * @param {Boolean} item
   */
  constructor({eventId, emoji, id, translations, lostTime, health, effect, experience, money, item}) {
    super();
    this.eventId = eventId;
    this.emoji = emoji;
    this.id = id;
    this.translations = translations;
    this.lostTime = lostTime || 0;
    this.health = health || 0;
    this.effect = effect || ':clock2:';
    this.experience = experience || 0;
    this.money = money || 0;
    this.item = item || false;
  }

  /**
   * @param {("fr"|"en")} language
   * @return {Object}
   */
  getTranslation(language) {
    return this.translations[language];
  }

}

module.exports = Possibility;
