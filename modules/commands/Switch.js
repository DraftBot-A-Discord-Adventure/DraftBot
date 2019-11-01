const InventoryManager = require('../classes/InventoryManager');
const ServerManager = require('../classes/ServerManager');
let Text

/**
 * Allow to charge the correct text file
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const chargeText = async function (message) {
    let serverManager = new ServerManager();
    let server = await serverManager.getServer(message);
    if (message.channel.id == 639446722845868101) {
        server.language = "en";
    }
    let address = '../text/' + server.language;
    return require(address);
}

/**
 * Allow to exchange the object that is in the player packup slot within the one that is active
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const switchCommand = async function (message) {
    Text = await chargeText(message);
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
