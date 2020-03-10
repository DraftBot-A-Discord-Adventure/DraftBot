const Config = require('../../utils/Config');
const EquipementManager = require('../../classes/EquipementManager');

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
            for (let i = 1; i < 100; i++) {
                let element = equipementManager.getWeaponById(i);
                message.channel.send(equipementManager.displayWeapon(element, "fr"))
            }
        }
        for (let i = 1; i < 100; i++) {
            let element = equipementManager.getArmorById(i);
            message.channel.send(equipementManager.displayArmor(element, "fr"))
        }
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



module.exports.ListItemsCommand = listItemsCommand;


