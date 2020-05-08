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
    return await this.getByPlayerIdOrCreate(message.author.id);
  }

  /**
   * Return a promise that will contain the inventory that is owned by the person with the given id
   * @param {string|String} playerId
   * @return {Promise<Inventory>}
   */
  async getByPlayerIdOrCreate(playerId) {
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
                }, JsonReader.models.inventories)));
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
               SET weaponId     = ?,
                   armorId      = ?,
                   potionId     = ?,
                   objectId     = ?,
                   backupItemId = ?,
                   lastDaily    = ?
               WHERE playerId = ?`,
            inventory.weaponId, inventory.armorId, inventory.potionId,
            inventory.objectId, inventory.backupItemId, inventory.lastDaily,
            inventory.playerId,
        )
        .catch(console.error);

    return inventory;
  }

}

module.exports = InventoryRepository;
