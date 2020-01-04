const Config = require('../../utils/Config');

/**
 * Allow an admin to restart the bot
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const resetCommand = async function (message, args,client) {
    if (userIsNotTheOwnerOfTheBot(message)) { // the author of the command is not the owner of the bot
        return console.log(message.author.username + " tried to use an admin command");
    } else { // the author of the command is the author of the bot
        client.guilds.get("429765017332613120").channels.get("433541702070960128").send(":red_circle: **Bot éteint par commande admin**")
        client.destroy();
        console.log("#### BOT ETEINT PAR COMMANDE ADMIN ####")
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



module.exports.ResetCommand = resetCommand;


