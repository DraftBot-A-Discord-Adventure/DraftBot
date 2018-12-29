const Event = require('./Event');
const Possibility = require('./Possibility');
const Config = require('../utils/Config');

const EventsData = require('../utils/Events');



class EventManager {

    /**
     * Load an event from the event file
     * @param {Number} id - The id of the event that has to be loaded
     * @returns {*} - The event loaded
     */
    loadEvent(id) {
        let event = new Event(id, EventsData.event[id])
        return event;
    }


    /**
     * Load one of the possibilities of the event
     * @param {Number} idEvent - The event the player is curently facing
     * @param {string} emoji  - The emoji the player selected
     * @param {Number} id  - The random id generated to select a posibility
     * @return {*} - The possibility loaded
     */
    loadPossibility(idEvent, emoji, id) {
        let possibility = new Possibility(idEvent, EventsData.possibility[idEvent][emoji][id])
        return possibility;
    }



}

module.exports = EventManager;