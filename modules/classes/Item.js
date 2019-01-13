const Config = require('../utils/Config');
const Tools = require('../utils/Tools');
const DefaultValues = require('../utils/DefaultValues')

/**
 * Base class that shouldn't be instantiated. Instead, Items are meant to extend this class.
 * Items are things like Objects, weapons...
 */
class Item {

    constructor(name, rareness, power) {
        this.name = name;
        this.rareness = rareness;
        this.power = power;
    }




    /**
     * Returns the name of the item
     * @returns {String} - The name
     */
    getName() {
        return this.name;
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
     * Save a weapon in the weapon slot of the inventory
     * @param {Number} weapon - The weapon that has to be saved
     */
    upgrade(powerToAdd) {
        if (Tools.isAPositiveNumber && this.power + powerToAdd < DefaultValues.item.maxPower)
            this.power = this.power + powerToAdd;
    }

}