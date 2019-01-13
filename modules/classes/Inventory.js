const Config = require('../utils/Config');
const Tools = require('../utils/Tools');
const DefaultValues = require('../utils/DefaultValues')

/**
 * Represents an Inventory.
 */
class Inventory {

    constructor(playerId, weapon, armor, potion, object, backupItem) {
        this.playerId = playerId;
        this.weapon = weapon;
        this.armor = armor;
        this.potion = potion;
        this.object = object;
    }


    /**
     * Returns the id of the player that own this inventory
     * @returns {Number} - The id of the player
     */
    getplayerId() {
        return this.playerId;
    }


    /**
     * Returns the weapon that is present in this inventory
     * @returns {*} - The weapon
     */
    getWeapon() {
        return this.weapon;
    }


    /**
     * Returns the armor that is present in this inventory
     * @returns {*} - The armor
     */
    getArmor() {
        return this.armor;
    }


    /**
     * Returns the potion that is present in this inventory
     * @returns {*} - The potion
     */
    getPotion() {
        return this.potion;
    }


    /**
     * Returns the object that is present in this inventory
     * @returns {*} - The object
     */
    getObject() {
        return this.object;
    }


    /**
     * Save a weapon in the weapon slot of the inventory
     * @param {*} weapon - The weapon that has to be saved
     */
    setWeapon(weapon) {
        this.weapon = weapon;
    }


    /**
     * Save a armor in the armor slot of the inventory
     * @param {*} armor - The armor that has to be saved
     */
    setArmor(armor) {
        this.armor = armor;
    }


    /**
     * Save a potion in the potion slot of the inventory
     * @param {*} potion - The potion that has to be saved
     */
    setPotion(potion) {
        this.potion = potion;
    }


    /**
     * Save a object in the object slot of the inventory
     * @param {*} object - The object that has to be saved
     */
    setObject(object) {
        this.object = object;
    }
}

module.exports = Inventory;