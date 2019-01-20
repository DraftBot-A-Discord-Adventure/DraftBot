const Config = require('../utils/Config');
const Tools = require('../utils/Tools');
const DefaultValues = require('../utils/DefaultValues')

/**
 * Represents an Inventory. Store the name of the objects the user have in its inventory. An item name is also an ID
 */
class Inventory {

    constructor(playerId, weaponName, armorName, potionName, objectName, backupItem) {
        this.playerId = playerId;
        this.weaponName = weaponName;
        this.armorName = armorName;
        this.potionName = potionName;
        this.objectName = objectName;
    }


    /**
     * Returns the id of the player that own this inventory
     * @returns {Number} - The id of the player
     */
    getplayerId() {
        return this.playerId;
    }


    /**
     * Returns the weapon name that is present in this inventory
     * @returns {String} - The weapon name
     */
    getWeaponName() {
        return this.weaponName;
    }


    /**
     * Returns the armor name that is present in this inventory
     * @returns {String} - The armor name
     */
    getArmorName() {
        return this.armorName;
    }


    /**
     * Returns the potion that is present in this inventory
     * @returns {String} - The potion name
     */
    getPotionName() {
        return this.potionName;
    }


    /**
     * Returns the object that is present in this inventory
     * @returns {String} - The object name
     */
    getObjectNam() {
        return this.objectName;
    }


    /**
     * Save a weapon name in the weapon slot of the inventory
     * @param {String} weaponName - The weapon name that has to be saved
     */
    setWeaponName(weaponName) {
        this.weaponName = weaponName;
    }


    /**
     * Save a armor in the armor slot of the inventory
     * @param {String} armorName - The armor name that has to be saved
     */
    setArmorName(armorName) {
        this.armorName = armorName;
    }


    /**
     * Save a potion in the potion slot of the inventory
     * @param {String} potionName - The potion name that has to be saved
     */
    setPotionName(potionName) {
        this.potionName = potionName;
    }


    /**
     * Save a object in the object slot of the inventory
     * @param {String} ObjectName - The Object name that has to be saved
     */
    setObjectName(ObjectName) {
        this.ObjectName = ObjectName;
    }
}

module.exports = Inventory;