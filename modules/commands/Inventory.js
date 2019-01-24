const InventoryManager = require('../classes/InventoryManager');
const Text = require('../text/Francais');
const ItemNames = require('../utils/items/Francais');

/**
 * Display the content of the inventory's inventory
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const inventoryCommand = async function (message) {
    let inventoryManager = new InventoryManager();
    let inventory = await inventoryManager.getCurrentInventory(message);
    let messageInventory = generateInventoryMessage(message, inventory);
    message.channel.send(messageInventory);
}

/**
 * Returns a string containing the inventory message.
 * @returns {String} - A string containing the inventory message.
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const generateInventoryMessage = function (message, inventory) {
    console.log(inventory);
    inventoryMessage = Text.commands.inventory.title + message.author.username + Text.commands.inventory.lineEnd1 + ItemNames.weapon[inventory.weaponId];
    
    return inventoryMessage;
};

module.exports.InventoryCommand = inventoryCommand;