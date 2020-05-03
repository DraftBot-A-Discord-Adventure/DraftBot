const EntityAbstract = require('entities/EntityAbstract');

/**
 * @property {Number} id
 * @property {Object} translations
 * @property {String} translations.fr
 * @property {String} translations.en
 * @property {Object} possibilities
 * @property {String[]} reactions
 */
class Event extends EntityAbstract {

  /**
   * @param {Number} id
   * @param {Object} translations
   * @param {String} translations.fr
   * @param {String} translations.en
   * @param {Object} possibilities
   */
  constructor({id, translations, possibilities}) {
    super();
    this.id = id;
    this.translations = translations;
    this.possibilities = possibilities;
    let possibilitiesKeys = Object.keys(possibilities);
    possibilitiesKeys.pop();
    this.reactions = possibilitiesKeys;
  }

  /**
   * @param {("fr"|"en")} language
   * @return {Object}
   */
  getTranslation(language) {
    return this.translations[language];
  }

}

module.exports = Event;
