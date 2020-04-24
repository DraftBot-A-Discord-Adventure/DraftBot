const Item = require('./Item');
const ItemNames = require('../utils/items/fr');

/**
 * Represent an object
 */
class Object extends Item {


    constructor(id, rareness, power, natureEffect) {
        super(id, rareness, power, 'object');
        this.natureEffect = natureEffect
    }


    /**
     * a number that match with an id of the effect applied by the object
     * @returns {number} - The id of the effect.
     */
    getNatureEffect() {
        return this.natureEffect;
    }

    /**
   * The amount of power of the potion
   * @returns {number} - The power of the potion.
   */
    getPower() {
        return this.power;
    }

    /**
     * Return the name of the object
     * @returns {String} - The name
     */
    getName() {
        return ItemNames.object[this.id];
    }

    /**
     * return the emoji that correspond to the object
     * @returns {String} - The emoji
     */
    getEmoji() {
        return ItemNames.object[this.id].split(" ")[0];
    }
}

module.exports = Object;