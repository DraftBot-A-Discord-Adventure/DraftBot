const EntityAbstract = require('entities/EntityAbstract');

class Possibility extends EntityAbstract {

  constructor({eventId, emoji, id, timeLost, healthPointsChange, newEffect, xpGained, moneyGained, item, translations}) {
    super();
    this.eventId = eventId;
    this.emoji = emoji;
    this.id = id;
    this.timeLost = timeLost;
    this.healthPointsChange = healthPointsChange;
    this.newEffect = newEffect;
    this.xpGained = xpGained;
    this.moneyGained = moneyGained;
    this.item = item;
    this.translations = translations;
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
