const EntityAbstract = require("entities/EntityAbstract");

/**
 * @property {String} playerId
 * @property {Number} weaponId
 * @property {Number} armorId
 * @property {Number} potionId
 * @property {Number} objectId
 * @property {Number} backupItemId
 * @property {Number} lastDaily
 */
class Inventory extends EntityAbstract {

  /**
   * @param {String} playerId
   * @param {Number} weaponId
   * @param {Number} armorId
   * @param {Number} potionId
   * @param {Number} objectId
   * @param {Number} backupItemId
   * @param {Number} lastDaily
   */
  constructor({playerId, weaponId, armorId, potionId, objectId, backupItemId, lastDaily}) {
    super();
    this.playerId = playerId;
    this.weaponId = weaponId;
    this.armorId = armorId;
    this.potionId = potionId;
    this.objectId = objectId;
    this.backupItemId = backupItemId;
    this.lastDaily = lastDaily;
  }

  // TODO 2.0 Legacy code
  // /**
  //  * Return the contained potion as an object
  //  * @returns {*} the potion
  //  */
  // getPotion() {
  //   return new Potion(this.potionId, parseInt(ItemValues.potion[this.potionId].rarity), parseInt(ItemValues.potion[this.potionId].power), parseInt(ItemValues.potion[this.potionId].nature))
  // }
  //
  // /**
  //  * Return the contained object as an object
  //  * @returns {*} the current active object
  //  */
  // getCurrentObject() {
  //   return new Object(this.objectId, parseInt(ItemValues.object[this.objectId].rarity), parseInt(ItemValues.object[this.objectId].power), parseInt(ItemValues.object[this.objectId].nature))
  // }

}

module.exports = Inventory;
