const InventoryManager = require('../classes/InventoryManager');
const Tools = require('../utils/Tools');

let Text

/**
 * Allow to exchange the object that is in the player packup slot within the one that is active
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const switchCommand = async function (message) {
    Text = await Tools.chargeText(message);
    let inventoryManager = new InventoryManager();
    let inventory = await inventoryManager.getCurrentInventory(message);
    inventoryManager.switch(inventory);
    let messageSwitch = generateSwitchMessage(message);
    message.channel.send(messageSwitch);
}

/**
 * Returns a string containing the switch message.
 * @returns {String} - A string containing the switch message.
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const generateSwitchMessage = function (message) {
    return Text.commands.switch.debut + message.author.username + Text.commands.switch.fin;
};
module.exports.SwitchCommand = switchCommand;
