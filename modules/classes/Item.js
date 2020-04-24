const DefaultValues = require('../utils/DefaultValues')

/**
 * Base class that shouldn't be instantiated. Instead, Items are meant to extend this class.
 * Items are things like Objects, weapons...
 * there are no setters methods for items because they are not editables
 */
class Item {

    constructor(id, rareness, power, type) {
        this.id = id;
        this.rareness = rareness;
        this.power = power;
        this.type = type;
    }


  /**
     * Returns the id of the item
     * @returns {String} - The id
     */
    getId() {
        return this.id;
    }


    /**
     * Returns the rareness of the item
     * @returns {Number} - The rareness
     */
    getRareness() {
        return this.rareness;
    }


    /**
     * Returns the power of the item
     * @returns {Number} - The power 
     */
    getPower() {
        return this.power;
    }

    /**
     * Return the value of the item
     * @returns {Number} - The value of the item
     */
    getValue(){
        return parseInt(DefaultValues.raritiesValues[this.rareness]) + parseInt(this.power);
    }

    /**
     * Returns the type of the item
     * @returns {String} - The type of the item
     */
    getType() {
        return this.type;
    }
}

module.exports = Item;