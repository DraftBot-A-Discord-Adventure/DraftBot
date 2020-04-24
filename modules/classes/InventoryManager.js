const Inventory = require('./Inventory');
const ItemValues = require('../utils/items/Values');
const DefaultValues = require('../utils/DefaultValues');
const sql = require("sqlite");

sql.open("./modules/data/database.sqlite");

class InventoryManager {


    /**
    * Return a promise that will contain the inventory that is owned by the person who send the message
    * @param message - The message that caused the function to be called. Used to retrieve the author of the message
    * @returns {promise} - The promise that will be resolved into a inventory
    */
    getCurrentInventory(message) {
        return sql.get(`SELECT * FROM inventory WHERE playerId = ?`, ["" + message.author.id]).then(inventory => {
            if (!inventory) { //inventory is not in the database
                console.log(`inventory unknown : ${message.author.username}`);
                return this.getNewInventory(message);
            } else { //inventory is in the database
                console.log(`inventory loaded : ${message.author.username}`);
                return new Inventory(inventory.playerId, inventory.weaponId, inventory.armorId, inventory.potionId, inventory.objectId, inventory.backupItemId, inventory.lastDaily)
            }
        }).catch(error => { //there is no database
            console.error(error)
            return false;
        })
    }


    /**
    * Return a promise that will contain the inventory that correspond to the id
    * @param id - the id of the inventory that own the inventory
    * @returns {promise} - The promise that will be resolved into a inventory
    */
    getInventoryById(id) {
        return sql.get(`SELECT * FROM inventory WHERE playerId = ?`, ["" + id]).then(inventory => {
            if (!inventory) { //inventory is not in the database
                console.log(`inventory unknown : ${id}`);
                return this.getNewInventoryById(id);
            } else { //inventory is in the database
                console.log(`inventory loaded : ${id}`);
                return new Inventory(inventory.playerId, inventory.weaponId, inventory.armorId, inventory.potionId, inventory.objectId, inventory.backupItemId, inventory.lastDaily)
            }
        }).catch(error => { //there is no database
            console.error(error)
            return false;
        })
    }


    /**
     * Return an inventory created from the defaul values and save it to the database
     * @param message - The message that caused the function to be called. Used to retrieve the author of the message
     * @returns {*} - A new inventory
     */
    getNewInventory(message) {
        console.log('Generating a new inventory...');
        let inventory = new Inventory(message.author.id, DefaultValues.inventory.weapon, DefaultValues.inventory.armor, DefaultValues.inventory.potion, DefaultValues.inventory.object, DefaultValues.inventory.backupItem, DefaultValues.inventory.lastDaily);
        this.addInventory(inventory);
        return inventory;
    }


    /**
     * Return an inventory created from the defaul values and save it to the database
     * @param id - The id that has to be used to create the inventory
     * @returns {*} - A new inventory
     */
    getNewInventoryById(id) {
        console.log('Generating a new inventory...');
        let inventory = new Inventory(id, DefaultValues.inventory.weapon, DefaultValues.inventory.armor, DefaultValues.inventory.potion, DefaultValues.inventory.object, DefaultValues.inventory.backupItem, DefaultValues.inventory.lastDaily);
        this.addInventory(inventory);
        return inventory;
    }


    /**
     * Allow to save the current state of a inventory in the database
     * @param {*} inventory - The inventory that has to be saved
     */
    updateInventory(inventory) {
        console.log("Updating inventory ...");
        sql.run(`UPDATE inventory SET playerId = ?, weaponId = ?, armorId = ?, potionId = ?, objectId = ?, backupItemId = ?,lastDaily = ? WHERE playerId = ?`,
            [inventory.playerId, "" + inventory.weaponId, "" + inventory.armorId, "" + inventory.potionId, "" + inventory.objectId, "" + inventory.backupItemId, "" + inventory.lastDaily, inventory.playerId]).catch(console.error);
        console.log("Inventory updated !");
    }


    /**
     * Allow to save a new inventory in the database
     * @param {*} inventory - The inventory that has to be saved
     */
    addInventory(inventory) {
        console.log("Creating inventory ...");
        sql.run(`INSERT INTO inventory (playerId, weaponId, armorId, potionId, objectId, backupItemId, lastDaily) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [inventory.playerId, "" + inventory.weaponId, "" + inventory.armorId, "" + inventory.potionId, "" + inventory.objectId, "" + inventory.backupItemId, "" + inventory.lastDaily]).catch(console.error);
        console.log("inventory created !");
    }


    /**
     * Return the value of the damage bonus
     * @returns {Number} the bonus effect from the inventory
     */
    async getDamageById(id) {
        let inv = await this.getInventoryById(id);
        let damage = parseInt(ItemValues.effect[ItemValues.weapon[inv.weaponId].rareness][ItemValues.weapon[inv.weaponId].power]);
        console.log(damage)
        if (ItemValues.object[inv.objectId].nature == 3) //if the object offer a damage bonus
            damage = damage + parseInt(ItemValues.object[inv.objectId].power);
        if (ItemValues.potion[inv.potionId].nature == 3) { //if the potion offer a damage bonus
            damage = damage + parseInt(ItemValues.potion[inv.potionId].power);
            inv.potionId = DefaultValues.inventory.potion;
            this.updateInventory(inv);
        }
        return damage;
    }

    /**
     * Return the value of the damage bonus
     * @returns {Number} the bonus effect from the inventory
     */
    async seeDamageById(id) {
        let inv = await this.getInventoryById(id);
        let damage = parseInt(ItemValues.effect[ItemValues.weapon[inv.weaponId].rareness][ItemValues.weapon[inv.weaponId].power]);
        console.log(damage)
        if (ItemValues.object[inv.objectId].nature == 3) //if the object offer a damage bonus
            damage = damage + parseInt(ItemValues.object[inv.objectId].power);
        if (ItemValues.potion[inv.potionId].nature == 3) { //if the potion offer a damage bonus
            damage = damage + parseInt(ItemValues.potion[inv.potionId].power);
        }
        return damage;
    }

    /**
     * Return the value of the defense bonus
     * @returns {Number} the bonus effect from the inventory
     */
    async getDefenseById(id) {
        let inv = await this.getInventoryById(id);
        let defense = parseInt(ItemValues.effect[ItemValues.armor[inv.armorId].rareness][ItemValues.armor[inv.armorId].power]);
        if (ItemValues.object[inv.objectId].nature == 4) //if the object offer a defense bonus
            defense = defense + parseInt(ItemValues.object[inv.objectId].power);
        if (ItemValues.potion[inv.potionId].nature == 4) { //if the potion offer a defense bonus
            defense = defense + parseInt(ItemValues.potion[inv.potionId].power);
            inv.potionId = DefaultValues.inventory.potion;
            this.updateInventory(inv);
        }
        return defense;
    }


    /**
     * Return the value of the defense bonus
     * @returns {Number} the bonus effect from the inventory
     */
    async seeDefenseById(id) {
        let inv = await this.getInventoryById(id);
        let defense = parseInt(ItemValues.effect[ItemValues.armor[inv.armorId].rareness][ItemValues.armor[inv.armorId].power]);
        if (ItemValues.object[inv.objectId].nature == 4) //if the object offer a defense bonus
            defense = defense + parseInt(ItemValues.object[inv.objectId].power);
        if (ItemValues.potion[inv.potionId].nature == 4) { //if the potion offer a defense bonus
            defense = defense + parseInt(ItemValues.potion[inv.potionId].power);
        }
        return defense;
    }


    /**
     * Return the value of the speed bonus
     * @returns {Number} the bonus effect from the inventory
     */
    async getSpeedById(id) {
        let inv = await this.getInventoryById(id);
        let speed = 0;
        if (ItemValues.object[inv.objectId].nature == 2) //if the object offer a speed bonus
            speed = speed + parseInt(ItemValues.object[inv.objectId].power);
        if (ItemValues.potion[inv.potionId].nature == 2) { //if the potion offer a speed bonus
            speed = speed + parseInt(ItemValues.potion[inv.potionId].power);
            inv.potionId = DefaultValues.inventory.potion;
            this.updateInventory(inv);
        }
        return speed;
    }

    /**
     * Return the value of the speed bonus
     * @returns {Number} the bonus effect from the inventory
     */
    async seeSpeedById(id) {
        let inv = await this.getInventoryById(id);
        let speed = 0;
        if (ItemValues.object[inv.objectId].nature == 2) //if the object offer a speed bonus
            speed = speed + parseInt(ItemValues.object[inv.objectId].power);
        if (ItemValues.potion[inv.potionId].nature == 2) { //if the potion offer a speed bonus
            speed = speed + parseInt(ItemValues.potion[inv.potionId].power);
        }
        return speed;
    }



    /**
     * Allow to switch the item in the backup slot within the one that is active
     * @param {*} inventory - The inventory that has to be changed
     */
    switch(inventory) {
        let passage = inventory.objectId;
        inventory.objectId = inventory.backupItemId;
        inventory.backupItemId = passage;
        this.updateInventory(inventory);
    }
}

module.exports = InventoryManager;
