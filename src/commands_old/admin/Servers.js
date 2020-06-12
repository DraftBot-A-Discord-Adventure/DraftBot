const Config = require('../../utils/Config');
const ServerManager = require('../../core/ServerManager');

/**
 * Allow an admin to check the server list
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const serversCommand = async function (message, args, client) {
    if (userIsNotTheOwnerOfTheBot(message)) { // the author of the command is not the owner of the bot
        return console.log(message.author.username + " tried to use an admin command");
    } else { // the author of the command is the author of the bot
        let compteur = 0;
        let total = 0;
        let resultat = "";
        function logMapElements(guilde) {
            compteur++;
            let serverManager = new ServerManager;
            let { validation, nbMembres, nbBot, ratio } = serverManager.getValidationInfos(guilde);
            total += nbMembres;
            resultat += `${validation} Server ${compteur} : **${guilde}** | :bust_in_silhouette: : \`${nbMembres}\`  | :robot: : \`${nbBot}\` | Ratio bot/Humain : \`${ratio}\` %\n`;
            if (resultat.length > 1800) {
                message.channel.send(resultat);
                resultat = "";
            }
        }
        client.guilds.forEach(logMapElements);
        resultat += `\n**Nombre total d'utilisateurs :** \`${total}\``
        message.channel.send(resultat);
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



module.exports.ServersCommand = serversCommand;


