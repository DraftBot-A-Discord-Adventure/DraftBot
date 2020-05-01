const EntityAbstract = require('entities/EntityAbstract');

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

  /**
   * Return string containing a description of an armor
   * @param {string} language - The language the object has to be displayed in
   * @returns {Object[]}
   */
  toEmbedObject(language) {
    let result = [];
    this.translations[language].split('\n').forEach(line => {

      if (line === '') {
        line = '\u200b';
      }

      result.push({
        name: '\u200b',
        value: line,
        inline: false,
      });

    });

    return result;
  }

}

module.exports = Event;
