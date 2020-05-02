const AppRepository = require('repositories/AppRepository');
const Inventory = require('entities/Inventory');

/**
 * @property {String} datasource
 * @property {module:sqlite3.Database} sql
 */
class InventoryRepository extends AppRepository {

  constructor() {
    super();
    this.datasource = DATASOURCE.SQLITE;
  }

  /**
   * Return a promise that will contain the inventory that is owned by the person who send the message
   * @param {module:"discord.js".Message} message
   * @return {Promise<Inventory>}
   */
  async getByMessageOrCreate(message) {
    return await this.getByPlayerId(message.author.id);
  }

    /**
     * Return a promise that will contain the inventory that is owned by the person with the given id
     * @param {string|String} playerId
     * @return {Promise<Inventory>}
     */
    async getByPlayerId(playerId) {
        return this.sql
            .get(`SELECT *
              FROM inventory
              WHERE playerId = ?`,
                playerId)
            .then(async inventory => {
                if (inventory) {
                    return new Inventory(inventory);
                } else {
                    return await this.create(new Inventory(
                        Object.assign({
                            playerId: playerId,
                        }, JsonReader.entities.inventory)));
                }
            })
            .catch(console.error);
    }

  /**
   * Allow to save a new inventory in the database and return it
   * @param {Inventory} inventory
   * @return {Promise<Inventory|void>}
   */
  async create(inventory) {
    await this.sql.run(
          `INSERT INTO inventory (playerId, weaponId, armorId, potionId,
                                  objectId, backupItemId, lastDaily)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        inventory.playerId, inventory.weaponId, inventory.armorId,
        inventory.potionId, inventory.objectId, inventory.backupItemId,
        inventory.lastDaily,
        )
        .catch(console.error);

    return inventory;
  }

  /**
   * Allow to update an inventory in the database and return it
   * @param {Inventory} inventory
   * @return {Promise<Inventory|void>}
   */
  async update(inventory) {
    await this.sql
        .run(
              `UPDATE inventory
               SET weaponId = ?,
                   armorId = ?,
                   potionId = ?,
                   objectId = ?,
                   backupItemId = ?,
                   lastDaily = ?
               WHERE playerId = ?`,
            inventory.weaponId, inventory.armorId, inventory.potionId,
            inventory.objectId, inventory.backupItemId, inventory.lastDaily,
            inventory.playerId,
        )
        .catch(console.error);

    return inventory;
  }

  // TODO 2.0 Legacy code
  // /**
  //  * Return a promise that will contain the inventory that correspond to the id
  //  * @param id - the id of the inventory that own the inventory
  //  * @returns {promise} - The promise that will be resolved into a inventory
  //  */
  // getInventoryById(id) {
  //   return sql.get(`SELECT * FROM inventory WHERE playerId = ?`, ["" + id]).then(inventory => {
  //     if (!inventory) { //inventory is not in the database
  //       console.log(`inventory unknown : ${id}`);
  //       return this.getNewInventoryById(id);
  //     } else { //inventory is in the database
  //       console.log(`inventory loaded : ${id}`);
  //       return new Inventory(inventory.playerId, inventory.weaponId, inventory.armorId, inventory.potionId, inventory.objectId, inventory.backupItemId, inventory.lastDaily)
  //     }
  //   }).catch(error => { //there is no database
  //     console.error(error)
  //     return false;
  //   })
  // }
  //
  // /**
  //  * Return an inventory created from the defaul values and save it to the database
  //  * @param id - The id that has to be used to create the inventory
  //  * @returns {*} - A new inventory
  //  */
  // getNewInventoryById(id) {
  //   console.log('Generating a new inventory...');
  //   let inventory = new Inventory(id, DefaultValues.inventory.weapon, DefaultValues.inventory.armor, DefaultValues.inventory.potion, DefaultValues.inventory.object, DefaultValues.inventory.backupItem, DefaultValues.inventory.lastDaily);
  //   this.addInventory(inventory);
  //   return inventory;
  // }
  //
  // /**
  //  * Return the value of the damage bonus
  //  * @returns {Number} the bonus effect from the inventory
  //  */
  // async getDamageById(id) {
  //   let inv = await this.getInventoryById(id);
  //   let damage = parseInt(ItemValues.effect[ItemValues.weapon[inv.weaponId].rarity][ItemValues.weapon[inv.weaponId].power]);
  //   console.log(damage)
  //   if (ItemValues.object[inv.objectId].nature == 3) //if the object offer a damage bonus
  //     damage = damage + parseInt(ItemValues.object[inv.objectId].power);
  //   if (ItemValues.potion[inv.potionId].nature == 3) { //if the potion offer a damage bonus
  //     damage = damage + parseInt(ItemValues.potion[inv.potionId].power);
  //     inv.potionId = DefaultValues.inventory.potion;
  //     this.updateInventory(inv);
  //   }
  //   return damage;
  // }
  //
  // /**
  //  * Return the value of the damage bonus
  //  * @returns {Number} the bonus effect from the inventory
  //  */
  // async seeDamageById(id) {
  //   let inv = await this.getInventoryById(id);
  //   let damage = parseInt(ItemValues.effect[ItemValues.weapon[inv.weaponId].rarity][ItemValues.weapon[inv.weaponId].power]);
  //   console.log(damage)
  //   if (ItemValues.object[inv.objectId].nature == 3) //if the object offer a damage bonus
  //     damage = damage + parseInt(ItemValues.object[inv.objectId].power);
  //   if (ItemValues.potion[inv.potionId].nature == 3) { //if the potion offer a damage bonus
  //     damage = damage + parseInt(ItemValues.potion[inv.potionId].power);
  //   }
  //   return damage;
  // }
  //
  // /**
  //  * Return the value of the defense bonus
  //  * @returns {Number} the bonus effect from the inventory
  //  */
  // async getDefenseById(id) {
  //   let inv = await this.getInventoryById(id);
  //   let defense = parseInt(ItemValues.effect[ItemValues.armor[inv.armorId].rarity][ItemValues.armor[inv.armorId].power]);
  //   if (ItemValues.object[inv.objectId].nature == 4) //if the object offer a defense bonus
  //     defense = defense + parseInt(ItemValues.object[inv.objectId].power);
  //   if (ItemValues.potion[inv.potionId].nature == 4) { //if the potion offer a defense bonus
  //     defense = defense + parseInt(ItemValues.potion[inv.potionId].power);
  //     inv.potionId = DefaultValues.inventory.potion;
  //     this.updateInventory(inv);
  //   }
  //   return defense;
  // }
  //
  // /**
  //  * Return the value of the defense bonus
  //  * @returns {Number} the bonus effect from the inventory
  //  */
  // async seeDefenseById(id) {
  //   let inv = await this.getInventoryById(id);
  //   let defense = parseInt(ItemValues.effect[ItemValues.armor[inv.armorId].rarity][ItemValues.armor[inv.armorId].power]);
  //   if (ItemValues.object[inv.objectId].nature == 4) //if the object offer a defense bonus
  //     defense = defense + parseInt(ItemValues.object[inv.objectId].power);
  //   if (ItemValues.potion[inv.potionId].nature == 4) { //if the potion offer a defense bonus
  //     defense = defense + parseInt(ItemValues.potion[inv.potionId].power);
  //   }
  //   return defense;
  // }
  //
  // /**
  //  * Return the value of the speed bonus
  //  * @returns {Number} the bonus effect from the inventory
  //  */
  // async getSpeedById(id) {
  //   let inv = await this.getInventoryById(id);
  //   let speed = 0;
  //   if (ItemValues.object[inv.objectId].nature == 2) //if the object offer a speed bonus
  //     speed = speed + parseInt(ItemValues.object[inv.objectId].power);
  //   if (ItemValues.potion[inv.potionId].nature == 2) { //if the potion offer a speed bonus
  //     speed = speed + parseInt(ItemValues.potion[inv.potionId].power);
  //     inv.potionId = DefaultValues.inventory.potion;
  //     this.updateInventory(inv);
  //   }
  //   return speed;
  // }
  //
  // /**
  //  * Return the value of the speed bonus
  //  * @returns {Number} the bonus effect from the inventory
  //  */
  // async seeSpeedById(id) {
  //   let inv = await this.getInventoryById(id);
  //   let speed = 0;
  //   if (ItemValues.object[inv.objectId].nature == 2) //if the object offer a speed bonus
  //     speed = speed + parseInt(ItemValues.object[inv.objectId].power);
  //   if (ItemValues.potion[inv.potionId].nature == 2) { //if the potion offer a speed bonus
  //     speed = speed + parseInt(ItemValues.potion[inv.potionId].power);
  //   }
  //   return speed;
  // }

}

module.exports = InventoryRepository;
