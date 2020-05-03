const AppRepository = require("repositories/AppRepository");
const Event = require("entities/Event");

/**
 * @property {String} datasource
 * @property {Object} events
 */
class EventRepository extends AppRepository {

  constructor() {
    super();
    this.datasource = DATASOURCE.JSON;
  }

  /**
   * Get the requested event
   * @param {Number} id
   * @return {Promise<Event>}
   */
  async getById(id) {
    return this.events[id];
  }

  /**
   * Get randomly an event, exclude event 0
   * @return {Promise<Event>}
   */
  async getRandom() {
    const id = Math.round(Math.random() * (Object.keys(this.events).length - 1)) + 1;
    return this.events[id];
  }

}

module.exports = EventRepository;
