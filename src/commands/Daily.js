const InventoryManager = require('../classes/InventoryManager');
const PlayerManager = require('../classes/PlayerManager');
const Tools = require('../utils/Tools');
const DefaultValues = require('../utils/DefaultValues');
let Text;
let language;

/**
 * Allow to use the object if the player has one in the dedicated slot of his inventory
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const dailyCommand = async function (message) {
    Text = await Tools.chargeText(message);
    language = await Tools.detectLanguage(message);
    currentDay = new Date()
    let inventoryManager = new InventoryManager();
    let playerManager = new PlayerManager();
    let player = await playerManager.getCurrentPlayer(message);
    let inventory = await inventoryManager.getCurrentInventory(message);
    let object = inventory.getCurrentObject();
    let messageDaily;
    if (player.isDead()) {
        //the player is dead
        return messageDaily = generateDailyDeadMessage(message, player);
    }

    if (currentDay.getDay() == inventory.lastDaily) {
        //an item has already been activated today
        messageDaily = generateDailyTimingErrorMessage(message);
    } else {
        console.log(object)
        //this is the first use of an object today
        switch (object.getNatureEffect()) {
            case 0:
                if (inventory.objectId != DefaultValues.inventory.object) { //there is a object that do nothing in the inventory
                    messageDaily = generateDailyErrorMessage(message, object);
                } else { //there is no object in the inventory
                    messageDaily = generateNoDailyMessage(message);
                }
                break;
            case 1: //the object is a heal object
                messageDaily = generateDailyHealthMessage(message, object);
                player.addHealthPoints(object.power, message, language);
                inventory.lastDaily = currentDay.getDay();
                break;
            case 2: //the object is a speed object
                messageDaily = generateDailyCombatMessage(message, object);
                break;
            case 3: //the object is a defense object
                messageDaily = generateDailyCombatMessage(message, object);
                break;
            case 4: //the object is a attack object
                messageDaily = generateDailyCombatMessage(message, object);
                break;
            case 5: //the object is a hospital object
                messageDaily = generateDailyHospitalMessage(message, object);
                player.setLastReport(parseInt(player.lastReport - parseInt(Tools.convertHoursInMiliseconds(object.power))));
                inventory.lastDaily = currentDay.getDay();
                break;
            case 6: //the object is a money giving object
                messageDaily = generateDailyMoneyMessage(message, object);
                player.addMoney(object.power);
                inventory.lastDaily = currentDay.getDay();
                break;
            default:
                inventory.lastDaily = currentDay.getDay();
                console.log("ERROR : A unknown object type has been dailyed !" + object.getNatureEffect())
                break;
        }
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
 * @returns {String} - A string containing the daily message that has to be send when the object do nothing
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param object - The object that has been used
 */
const generateDailyErrorMessage = function (message, object) {
    return object.getEmoji() + Text.commands.daily.errorDebut + message.author.username + Text.commands.daily.errorFin;
};

/**
 * Returns a string containing the daily error message.
 * @returns {String} - A string containing the daily message that has to be send when the object do nothing
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param player - The player that is dead
 */
const generateDailyDeadMessage = function (message, player) {
    return player.effect + Text.commands.daily.errorDebut + message.author.username + Text.commands.daily.errorDead;
};



/**
 * Returns a string containing the daily error message.
 * @returns {String} - A string containing the daily message that has to be send when the object do nothing
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.ed
 */
const generateDailyTimingErrorMessage = function (message) {
    return Text.commands.daily.errorDebutTiming + message.author.username + Text.commands.daily.errorFinTiming;
};


/**
 * Returns a string containing the daily combat message.
 * @returns {String} - A string containing the daily message that has to be send when the object can only be used during a fight
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param object - The object that has been used
 */
const generateDailyCombatMessage = function (message, object) {
    return object.getEmoji() + Text.commands.daily.combatDebut + message.author.username + Text.commands.daily.combatFin;
};


/**
 * Returns a string containing the daily health message.
 * @returns {String} - A string containing the daily message that has to be send when the object heal the player
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param object - The object that has been used.
 */
const generateDailyHealthMessage = function (message, object) {
    return object.getEmoji() + Text.commands.daily.healDebut + message.author.username + Text.commands.daily.healBonus + object.getPower() + Text.commands.daily.healFin;
};

/**
 * Returns a string containing the daily health message.
 * @returns {String} - A string containing the daily message that has to be send when the object heal the player
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param object - The object that has been used.
 */
const generateDailyMoneyMessage = function (message, object) {
    return object.getEmoji() + Text.commands.daily.moneyDebut + message.author.username + Text.commands.daily.moneyBonus + object.getPower() + Text.commands.daily.moneyFin;
};

/**
 * Returns a string containing the daily hospital message.
 * @returns {String} - A string containing the daily message that has to be send when the object make hospital stays shorter
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param object - The object that has been used.
 */
const generateDailyHospitalMessage = function (message, object) {
    return object.getEmoji() + Text.commands.daily.hospitalDebut + message.author.username + Text.commands.daily.hospitalBonus + object.getPower() + Text.commands.daily.hospitalFin;
};


module.exports.DailyCommand = dailyCommand;