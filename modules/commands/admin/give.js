const Config = require('../../utils/Config');
const EquipementManager = require('../../classes/EquipementManager');
/**
 * Allow an admin to give an item to somebody
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const giveCommand = function (message) {
   if (userIsNotTheOwnerOfTheBot(message)) { // the author of the command is not the owner of the bot
      return console.log(message.author.username + " tried to use an admin command");
   } else { // the author of the command is the author of the bot
    let equipementManager = new EquipementManager();
    equipementManager.generateRandomWeapon()


     
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


