const AppRepository = require("repositories/AppRepository");
const Possibility = require("entities/Possibility");

/**
 * @property {String} datasource
 * @property {Object} events
 */
class PossibilityRepository extends AppRepository {

  constructor() {
    super();
    this.datasource = DATASOURCE.JSON;
  }

  /**
   * Get the requested possibility
   * @param {number|String} eventId
   * @param {String} emoji
   * @param {number} id
   * @return {Promise<Possibility>}
   */
  async getByIdAndEmoji(eventId, emoji, id) {
    return new Possibility(
        eventId,
        emoji,
        id,
        this.text.events.possibility[eventId][emoji][id].timeLost,
        this.text.events.possibility[eventId][emoji][id].healthPointsChange,
        this.text.events.possibility[eventId][emoji][id].newEffect,
        this.text.events.possibility[eventId][emoji][id].xpGained,
        this.text.events.possibility[eventId][emoji][id].moneyGained,
        this.text.events.possibility[eventId][emoji][id].item,
        {
          "fr": Config.text.fr.possibilities[eventId][emoji][id],
          "en": Config.text.en.possibilities[eventId][emoji][id]
        }
    );
  }

  /**
   * Get randomly a possibility
   * @param {number|String} eventId
   * @param {String} emoji
   * @return {Promise<Possibility>}
   */
  async getRandomByIdAndEmoji(eventId, emoji) {
    const id = Math.round(Math.random() * (Object.keys(this.text.events.possibility[eventId][emoji]).length - 1)) + 1;
    return new Possibility(
        eventId,
        emoji,
        id,
        this.text.events.possibility[eventId][emoji][id].timeLost,
        this.text.events.possibility[eventId][emoji][id].healthPointsChange,
        this.text.events.possibility[eventId][emoji][id].newEffect,
        this.text.events.possibility[eventId][emoji][id].xpGained,
        this.text.events.possibility[eventId][emoji][id].moneyGained,
        this.text.events.possibility[eventId][emoji][id].item,
        {
          "fr": Config.text.fr.possibilities[eventId][emoji][id],
          "en": Config.text.en.possibilities[eventId][emoji][id]
        }
    );
  }

}

module.exports = PossibilityRepository;
