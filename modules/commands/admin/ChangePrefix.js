const Config = require('../../utils/Config');
const ServerManager = require('../../classes/ServerManager');

/**
 * Allow an admin to change the prefix the bot use in a specific server
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const changePrefixCommand = async function (message, args) {
    if (userIsNotTheOwnerOfTheBot(message)) { // the author of the command is not the owner of the bot
        return console.log(message.author.username + " tried to use an admin command");
    } else { // the author of the command is the author of the bot
        let serverId = args[1];
        let newPrefix = args[2];
        let serverManager = new ServerManager();
        let server = await serverManager.getServerById(serverId);
        server.prefix = newPrefix;
        serverManager.updateServer(server);
        message.channel.send(":white_check_mark: Le serveur d'id : "+ serverId + " a désormais pour préfix : " + newPrefix);
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



module.exports.ChangePrefixCommand = changePrefixCommand;


