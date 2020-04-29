const InventoryManager = require('../core/InventoryManager');
const PlayerManager = require('../core/PlayerManager');
const Tools = require('../utils/Tools');
const DefaultValues = require('data/text/DefaultValues');
let Text;
let language;


/**
 * Allow to use the potion if the player has one in the dedicated slot of his inventory
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const drinkCommand = async function (message) {

    //chargement de la langue
    Text = await Tools.chargeText(message);
    language = await Tools.detectLanguage(message);

    let inventoryManager = new InventoryManager();
    let playerManager = new PlayerManager();
    let player = await playerManager.getCurrentPlayer(message);
    let inventory = await inventoryManager.getCurrentInventory(message);
    let potion = inventory.getPotion();
    let messageDrink;
    switch (potion.getNatureEffect()) {
        case 0:
            if (inventory.potionId != DefaultValues.inventory.potion) { //there is a potion that do nothing in the inventory
                messageDrink = generateDrinkErrorMessage(message, potion);
                inventory.potionId = DefaultValues.inventory.potion;
            } else { //there is no potion in the inventory
                messageDrink = generateNoDrinkMessage(message);
            }
            break;
        case 1: //the potion is a heal potion
            messageDrink = generateDrinkHealthMessage(message, potion);
            player.addHealthPoints(potion.power, message, language);
            inventory.potionId = DefaultValues.inventory.potion;
            break;
        case 2: //the potion is a speed potion
            messageDrink = generateDrinkCombatMessage(message, potion);
            break;
        case 3: //the potion is a defense potion
            messageDrink = generateDrinkCombatMessage(message, potion);
            break;
        case 4: //the potion is a attack potion
            messageDrink = generateDrinkCombatMessage(message, potion);
            break;
        case 5: //the potion is a hospital potion
            messageDrink = generateDrinkHospitalMessage(message, potion);
            player.setLastReport(parseInt(player.lastReport - parseInt(Tools.convertHoursInMiliseconds(potion.power))));
            inventory.potionId = DefaultValues.inventory.potion;
            break;

        default:
            inventory.potionId = DefaultValues.inventory.potion;
            console.log("ERROR : A unknown potion type has been drinked !" + potion.getNatureEffect())
            break;
    }
    playerManager.updatePlayer(player);
    inventoryManager.updateInventory(inventory);
    message.channel.send(messageDrink);
}


/**
 * Returns a string containing the nodrink message.
 * @returns {String} - A string containing the nodrink message.
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const generateNoDrinkMessage = function (message) {
    return Text.commands.drink.noDebut + message.author.username + Text.commands.drink.noFin;
};


/**
 * Returns a string containing the drink error message.
 * @returns {String} - A string containing the drink message that has to be send when the potion do nothing
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param potion - The potion that has been drunk
 */
const generateDrinkErrorMessage = function (message, potion) {
    return potion.getEmoji() + Text.commands.drink.errorDebut + message.author.username + Text.commands.drink.errorFin;
};


/**
 * Returns a string containing the drink combat message.
 * @returns {String} - A string containing the drink message that has to be send when the potion can only be use during a fight
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param potion - The potion that has been drunk
 */
const generateDrinkCombatMessage = function (message, potion) {
    return potion.getEmoji() + Text.commands.drink.combatDebut + message.author.username + Text.commands.drink.combatFin;
};


/**
 * Returns a string containing the drink health message.
 * @returns {String} - A string containing the drink message that has to be send when the potion heal the player
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param potion - The potion that has been drunk.
 */
const generateDrinkHealthMessage = function (message, potion) {
    return potion.getEmoji() + Text.commands.drink.healDebut + message.author.username + Text.commands.drink.healBonus + potion.getPower() + Text.commands.drink.healFin;
};


/**
 * Returns a string containing the drink hospital message.
 * @returns {String} - A string containing the drink message that has to be send when the potion make hospital stays shorter
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param potion - The potion that has been drunk.
 */
const generateDrinkHospitalMessage = function (message, potion) {
    return potion.getEmoji() + Text.commands.drink.hospitalDebut + message.author.username + Text.commands.drink.hospitalBonus + potion.getPower() + Text.commands.drink.hospitalFin;
};


module.exports.DrinkCommand = drinkCommand;
