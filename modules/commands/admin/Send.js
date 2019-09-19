const Config = require('../../utils/Config');

/**
 * Allow an admin to send a dm to somebody
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const sendCommand = async function (message, args, client) {
    if (userIsNotTheOwnerOfTheBot(message)) { // the author of the command is not the owner of the bot
        return console.log(message.author.username + " tried to use an admin command");
    } else { // the author of the command is the author of the bot
        let playerId = args[1];
        let user = client.users.get(playerId)
        let string = message.content.substr(message.content.indexOf(" ") + 2);
        let finalmessage = string.substr(string.indexOf(" ") + 1);
        user.send(finalmessage).catch(err => {message.channel.send(":x: | La personne a désactivé ses messages privés !")}).then(err => {message.channel.send(":white_check_mark: | DM envoyé !")});
     
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



module.exports.SendCommand = sendCommand;


