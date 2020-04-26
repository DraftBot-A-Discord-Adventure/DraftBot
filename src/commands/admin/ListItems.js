const Config = require('../../utils/Config');
const EquipementManager = require('../../classes/EquipementManager');
const DefaultValues = require('data/text/DefaultValues');

/**
 * Allow an admin to list all items
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const listItemsCommand = async function (message, args) {
    if (userIsNotTheOwnerOfTheBot(message)) { // the author of the command is not the owner of the bot
        return console.log(message.author.username + " tried to use an admin command");
    } else { // the author of the command is the author of the bot
        equipementManager = new EquipementManager();
        if (args[1] > 1) {
            listWeapons(message);
        }
        listArmors(message);
    }
};


/**
 * Send a list of all the armors of the bot
 * @param {*} message
 */
function listArmors(message) {
    for (let i = 1; i < DefaultValues.raritiesGenerator.numberOfArmor; i++) {
        let element = equipementManager.getArmorById(i);
        message.channel.send(equipementManager.displayArmor(element, "fr"));
    }
}

/**
 * Send a list of all the weapons of the bot
 * @param {*} message
 */
function listWeapons(message) {
    for (let i = 1; i < DefaultValues.raritiesGenerator.numberOfWeapon; i++) {
        let element = equipementManager.getWeaponById(i);
        message.channel.send(equipementManager.displayWeapon(element, "fr"));
    }
}

/**
 * Test if the person who sent the message is the owner of the bot.
 * @returns {boolean} - A boolean containing false if the user is the owner.
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
function userIsNotTheOwnerOfTheBot(message) {
    return message.author.id != Config.BOT_OWNER_ID;
}



module.exports.ListItemsCommand = listItemsCommand;


