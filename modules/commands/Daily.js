const InventoryManager = require('../classes/InventoryManager');
const PlayerManager = require('../classes/PlayerManager');
const Text = require('../text/Francais');
const Tools = require('../utils/Tools');

/**
 * Allow to use the potion if the player has one in the dedicated slot of his inventory
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const dailyCommand = async function (message) {
    let inventoryManager = new InventoryManager();
    let playerManager = new PlayerManager();
    let player = await playerManager.getCurrentPlayer(message);
    let inventory = await inventoryManager.getCurrentInventory(message);
    let potion = inventory.getPotion();
    let messageDaily;
    switch (potion.getNatureEffect()) {
        case 0:
            if (inventory.potionId != "default") { //there is a potion that do nothing in the inventory
                messageDaily = generateDailyErrorMessage(message, potion);
                inventory.potionId = "default";
            } else { //there is no potion in the inventory
                messageDaily = generateNoDailyMessage(message);
            }
            break;
        case 1: //the potion is a heal potion
            messageDaily = generateDailyHealthMessage(message, potion);
            player.addHealthPoints(potion.power);
            inventory.potionId = "default";
            break;
        case 2: //the potion is a speed potion
            messageDaily = generateDailyCombatMessage(message, potion);
            break;
        case 3: //the potion is a defense potion
            messageDaily = generateDailyCombatMessage(message, potion);
            break;
        case 4: //the potion is a attack potion
            messageDaily = generateDailyCombatMessage(message, potion);
            break;
        case 5: //the potion is a hospital potion
            messageDaily = generateDailyHospitalMessage(message, potion);
            player.setLastReport(parseInt(player.lastReport - parseInt(Tools.convertHoursInMiliseconds(potion.power))));
            inventory.potionId = "default";
            break;

        default:
            inventory.potionId = "default";
            console.log("ERROR : A unknown potion type has been dailyed !" + potion.getNatureEffect())
            break;
    }
    playerManager.updatePlayer(player);
    inventoryManager.updateInventory(inventory);
    message.channel.send(messageDaily);
}


/**
 * Returns a string containing the nodaily message.
 * @returns {String} - A string containing the nodaily message.
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const generateNoDailyMessage = function (message) {
    return Text.commands.daily.noDebut + message.author.username + Text.commands.daily.noFin;
};


/**
 * Returns a string containing the daily error message.
 * @returns {String} - A string containing the daily message that has to be send when the potion do nothing
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param potion - The potion that has been drunk
 */
const generateDailyErrorMessage = function (message, potion) {
    return potion.getEmoji() + Text.commands.daily.errorDebut + message.author.username + Text.commands.daily.errorFin;
};


/**
 * Returns a string containing the daily combat message.
 * @returns {String} - A string containing the daily message that has to be send when the potion can only be use during a fight
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param potion - The potion that has been drunk
 */
const generateDailyCombatMessage = function (message, potion) {
    return potion.getEmoji() + Text.commands.daily.combatDebut + message.author.username + Text.commands.daily.combatFin;
};


/**
 * Returns a string containing the daily health message.
 * @returns {String} - A string containing the daily message that has to be send when the potion heal the player
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param potion - The potion that has been drunk.
 */
const generateDailyHealthMessage = function (message, potion) {
    return potion.getEmoji() + Text.commands.daily.healDebut + message.author.username + Text.commands.daily.healBonus + potion.getPower() + Text.commands.daily.healFin;
};


/**
 * Returns a string containing the daily hospital message.
 * @returns {String} - A string containing the daily message that has to be send when the potion make hospital stays shorter
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param potion - The potion that has been drunk.
 */
const generateDailyHospitalMessage = function (message, potion) {
    return potion.getEmoji() + Text.commands.daily.hospitalDebut + message.author.username + Text.commands.daily.hospitalBonus + potion.getPower() + Text.commands.daily.hospitalFin;
};


module.exports.DailyCommand = dailyCommand;