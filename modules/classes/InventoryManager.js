const Inventory = require('./Inventory');
const Object = require('./Object');
const Equipement = require('./Equipement');
const Potion = require('./Potion');
const DefaultValues = require('../utils/DefaultValues')
const Config = require('../utils/Config')
const sql = require("sqlite");
const Tools = require('../utils/Tools');

sql.open("./modules/data/database.sqlite");

class InventoryManager {


    /**
    * Return a promise that will contain the inventory that is owned by the person who send the message
    * @param message - The message that caused the function to be called. Used to retrieve the author of the message
    * @returns {promise} - The promise that will be resolved into a inventory
    */
    getCurrentInventory(message) {
        return sql.get(`SELECT * FROM inventory WHERE playerId ="${message.author.id}"`).then(inventory => {
            if (!inventory) { //inventory is not in the database
                console.log(`Utilisateur inconnu : ${message.author.username}`);
                return this.getNewInventory(message);
            } else { //inventory is in the database
                console.log(`Utilisateur reconnu : ${message.author.username}`);
                return new Inventory(inventory.playerId, inventory.weapon, inventory.armor, inventory.potion, inventory.object, inventory.backupItem)
            }
        }).catch(error => { //there is no database
            console.error(error)
            return false;
        })
    }


    /**
     * Return an inventory created from the defaul values
     * @param message - The message that caused the function to be called. Used to retrieve the author of the message
     * @returns {*} - A new inventory
     */
    getNewInventory(message) {
        console.log('Generating a new inventory...');
        return new Inventory(message.author.id, new Equipement(DefaultValues.weapon), new Equipement(DefaultValues.armor), new Potion(DefaultValues.potion), new Object(DefaultValues.weapon));
    }


}

module.exports = InventoryManager;