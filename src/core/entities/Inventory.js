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

  /**
   * Returns the inventory as embed list
   * @param {"fr"|"en"} language The language the inventory has to be displayed in
   * @param playerName The name of the player. Provide it only if you have it, to avoid searching in the database. Else don't provide this argument or provide undefined
   * @returns {[string|{String}]}
   */
  async embedInventory(language, playerName = undefined) {
    if (playerName === undefined) {
      playerName = (await getRepository('player').getByIdOrCreate(this.playerId)).getPseudo(language);
    }
    return [
      format(JsonReader.entities.inventory.getTranslation(language).inventoryTitle, {player:playerName}),
      {name: JsonReader.entities.inventory.getTranslation(language).weaponTitle, value: (await getRepository('weapon').getById(this.weaponId)).display(language)},
      {name: JsonReader.entities.inventory.getTranslation(language).armorTitle, value: (await getRepository('armor').getById(this.armorId)).display(language)},
      {name: JsonReader.entities.inventory.getTranslation(language).potionTitle, value: (await getRepository('potion').getById(this.potionId)).display(language)},
      {name: JsonReader.entities.inventory.getTranslation(language).dObjectTitle, value: (await getRepository('object').getById(this.objectId)).display(language)},
      {name: JsonReader.entities.inventory.getTranslation(language).dObjectTitle, value: (await getRepository('object').getById(this.backupItemId)).display(language)}
    ];
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
