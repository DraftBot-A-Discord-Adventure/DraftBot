const Config = require('../utils/Config');
const Tools = require('../utils/Tools');
const DefaultValues = require('../utils/DefaultValues')

/**
 * Represents an Inventory. Store the name of the objects the user have in its inventory. An item name is also an ID
 */
class Inventory {

    constructor(playerId, weaponId, armorId, potionId, objectId, backupItem) {
        this.playerId = playerId;
        this.weaponId = weaponId;
        this.armorId = armorId;
        this.potionId = potionId;
        this.objectId = objectId;
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
    getWeaponId() {
        return this.weaponId;
    }


    /**
     * Returns the armor name that is present in this inventory
     * @returns {String} - The armor name
     */
    getArmorId() {
        return this.armorId;
    }


    /**
     * Returns the potion that is present in this inventory
     * @returns {String} - The potion name
     */
    getPotionId() {
        return this.potionId;
    }


    /**
     * Returns the object that is present in this inventory
     * @returns {String} - The object name
     */
    getObjectNam() {
        return this.objectId;
    }


    /**
     * Save a weapon name in the weapon slot of the inventory
     * @param {String} weaponId - The weapon name that has to be saved
     */
    setWeaponId(weaponId) {
        this.weaponId = weaponId;
    }


    /**
     * Save a armor in the armor slot of the inventory
     * @param {String} armorId - The armor name that has to be saved
     */
    setArmorId(armorId) {
        this.armorId = armorId;
    }


    /**
     * Save a potion in the potion slot of the inventory
     * @param {String} potionId - The potion name that has to be saved
     */
    setPotionId(potionId) {
        this.potionId = potionId;
    }


    /**
     * Save a object in the object slot of the inventory
     * @param {String} ObjectId - The Object name that has to be saved
     */
    setObjectId(ObjectId) {
        this.ObjectId = ObjectId;
    }
}

module.exports = Inventory;