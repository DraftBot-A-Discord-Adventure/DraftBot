const ItemManager = require("../classes/ItemManager");
const PlayerManager = require('../classes/PlayerManager');
const ObjectManager = require('../classes/ObjectManager');
const InventoryManager = require('../classes/InventoryManager');
const DefaultValues = require('../utils/DefaultValues');
const Tools = require('../utils/Tools');

let Text;


/**
 * Allow to sell the item that is stored in the backup position of the inventory of the player
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const sellCommand = async function (message, args, client, talkedRecently) {
    Text = await Tools.chargeText(message);
    if (talkedRecently.has(message.author.id)) {
        message.channel.send(Text.commands.sell.cancelStart + message.author + Text.commands.shop.tooMuchShop);
    } else {
        talkedRecently.add(message.author.id);
        let playerManager = new PlayerManager();
        let player = await playerManager.getCurrentPlayer(message);
        let inventoryManager = new InventoryManager();
        let inventory = await inventoryManager.getCurrentInventory(message);
        let objectManager = new ObjectManager();
        let object = objectManager.getObjectById(inventory.getBackupItemId());
        if (object.id == DefaultValues.inventory.object) {
            let messageSell = generateErrorSellMessage(message);
            message.channel.send(messageSell);
            talkedRecently.delete(message.author.id);
        } else {
            generateConfirmation(message, object, player, inventory, inventoryManager, playerManager, talkedRecently)
        }
    }
}
/**
 * Returns a string containing the error sell message.
 * @returns {String} - A string containing the error sell message.
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const generateErrorSellMessage = function (message) {
    return Text.commands.sell.noDebut + message.author.username + Text.commands.sell.noFin;
};

/**
 * Allow to check if the user know what he is doing and to lanch the sell
 * @param {*} message - The message that cause the event do be generated
 * @param {*} object - The object that could be sold
 * @param {*} player - The player that did the sell command
 * @param {*} inventory - The inventory of the player
 * @param {*} inventoryManager - The manager of the inventory
 * @param {*} playerManager - The manager of the player
 */
async function generateConfirmation(message, object, player, inventory, inventoryManager, playerManager, talkedRecently) {
    let confirmMessage = await generateConfirmMessage(message, object);
    let confirmIsOpen = true;

    let msg = await displayConfirmMessage(message, confirmMessage);
    let language = await Tools.detectLanguage(message);
    const filter = (reaction, user) => {
        return (reactionIsCorrect(reaction) && user.id === message.author.id);
    };
    const collector = msg.createReactionCollector(filter, {
        time: 120000
    });
    //execute this if a user answer to the event
    collector.on('collect', (reaction) => {
        if (confirmIsOpen) {
            talkedRecently.delete(message.author.id);
            if (reaction.emoji.name == "✅") {
                playerManager.sellItem(player, object, false, message, language);
                inventory.setBackupItemId(DefaultValues.inventory.object);
                inventoryManager.updateInventory(inventory);
                playerManager.updatePlayer(player);
            } else {
                message.channel.send(Text.commands.sell.cancelStart + message.author + Text.commands.sell.cancelEnd);
            }
            confirmIsOpen = false;

        }
    });
    //end of the time the user have to answer to the event
    collector.on('end', () => {
        if (confirmIsOpen) {
            talkedRecently.delete(message.author.id);
            message.channel.send(Text.commands.sell.cancelStart + message.author + Text.commands.sell.cancelEnd);
        }
    });
}


/**
 * send a confirmation and display reactions
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param {*} confirmMessage - The string of the confirmation message
 */
const displayConfirmMessage = function (message, confirmMessage) {
    return message.channel.send(confirmMessage).then(msg => {
        let valid = "✅"
        msg.react(valid);
        let notValid = "❌"
        msg.react(notValid);
        return msg;
    })
};

/**
* Check if the reaction recieved is valid
* @param {*} reaction - The reaction recieved
* @returns {Boolean} - true is the reaction is correct
*/
const reactionIsCorrect = function (reaction) {
    let contains = false;
    if (reaction.emoji.name == "✅" || reaction.emoji.name == "❌") {
        contains = true;
    }
    return contains
}


/**
 * Returns a string containing the error sell message.
 * @returns {String} - A string containing the error sell message.
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const generateConfirmMessage = async function (message, object) {
    let value = object.getValue();
    let language = await Tools.detectLanguage(message);
    return Text.commands.sell.confirmDebut + message.author.username + Text.commands.sell.confirmIntro + new ItemManager().getItemSimpleName(object, language) + Text.commands.sell.confirmMiddle + value + Text.commands.sell.confirmEnd;
};

module.exports.SellCommand = sellCommand;