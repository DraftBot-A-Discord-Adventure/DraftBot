const Config = require('../../utils/Config');
const InventoryManager = require('../../classes/InventoryManager');

/**
 * Allow an admin to give an item to somebody
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const giveCommand = async function (message, args) {
    if (userIsNotTheOwnerOfTheBot(message)) { // the author of the command is not the owner of the bot
        return console.log(message.author.username + " tried to use an admin command");
    } else { // the author of the command is the author of the bot
        let playerId = args[1];
        let itemType = args[2]+"Id";
        let itemId = args[3];
        let inventoryManager = new InventoryManager();
        let inventory = await inventoryManager.getInventoryById(playerId);
        inventory[itemType] = itemId;
        inventoryManager.updateInventory(inventory);
        message.channel.send(":white_check_mark:  Operation terminée !")
    }
};

/**
 * Test if the person who sent the message is the owner of the bot.
 * @returns {boolean} - A boolean containing false if the user is the owner.
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
function userIsNotTheOwnerOfTheBot(message) {
    return message.author.id != Config.BOT_OWNER_ID;
}



module.exports.GiveCommand = giveCommand;


