const Config = require('../../utils/Config');

/**
 * Initialize the database if it dont already exist
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const initDatabaseCommand = function (message) {
   if (userIsNotTheOwnerOfTheBot(message)) { // the author of the command is not the owner of the bot
      return console.log(message.author.username + " tried to use an admin command");
   } else { // the author of the command is the author of the bot
      console.log('Start the database creation script');
     
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



module.exports.InitDatabaseCommand = initDatabaseCommand;


