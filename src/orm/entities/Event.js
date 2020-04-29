const EntityAbstract = require("entities/EntityAbstract");

class Event extends EntityAbstract {

  constructor(id, translations, emojis) {
    super();
    this.id = id;
    this.translations = translations;
    this.emojis = emojis;
  }

  /**
   * Return the name of the event
   * @param {string} language
   * @return {string}
   */
  getTranslation(language) {
    return this.translations[language];
  }

}

module.exports = Event;
