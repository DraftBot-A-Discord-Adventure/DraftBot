const Item = require('./Item');
const ItemNames = require('../utils/items/fr');

/**
 * Represent a potion This is like a normal object but it can only be used one time
 */
class Potion extends Item {


    constructor(id, rareness, power, natureEffect) {
        super(id, rareness, power, 'potion');
        this.natureEffect = natureEffect;
    }


    /**
     * A number that match with an id of the effect applied by the potion
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
     * Return the name of the potion
     * @returns {String} - The name
     */
    getName() {
        return ItemNames.potion[this.id];
    }

    /**
     * return the emoji that correspond to the potion
     * @returns {String} - The emoji
     */
    getEmoji() {
        return ItemNames.potion[this.id].split(" ")[0];
    }
}

module.exports = Potion;