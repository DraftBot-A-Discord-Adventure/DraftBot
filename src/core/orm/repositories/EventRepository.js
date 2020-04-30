const RepositoryAbstract = require("repositories/RepositoryAbstract");
const Event = require("entities/Event");

class EventRepository extends RepositoryAbstract {

  /**
   * Get the requested event
   * @param {number} id
   * @return {Promise<Event>}
   */
  async getById(id) {
    return new Event(
        id,
        {
          "fr": Config.text.fr.events[id],
          "en": Config.text.en.events[id]
        },
        this.text.events.event[id]
    );
  }

  /**
   * Get randomly an event
   * @return {Promise<Event>}
   */
  async getRandom() {
    const id = Math.round(Math.random() * (Object.keys(this.text.events.event).length - 1)) + 1;
    return new Event(
        id,
        {
          "fr": Config.text.fr.events[id],
          "en": Config.text.en.events[id]
        },
        this.text.events.event[id]
    );
  }

}

module.exports = EventRepository;
