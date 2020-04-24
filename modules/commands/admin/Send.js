const Config = require('../../utils/Config');

/**
 * Allow an admin to send a dm to somebody
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const sendCommand = async function (message, args, client) {
    message.delete();
    if (userIsNotTheOwnerOfTheBotOrASupportMember(message)) { // the author of the command is not the owner of the bot
        return console.log(message.author.username + " tried to use an admin command");
    } else { // the author of the command is the author of the bot
        let playerId = args[1];
        let user = client.users.get(playerId)
        let string = message.content.substr(message.content.indexOf(" ") + 2);
        let finalmessage = string.substr(string.indexOf(" ") + 1);
        finalmessage = finalmessage +"\n\n- "+ message.author.username;
        user.send(finalmessage).then(err => {
            message.channel.send(":white_check_mark: | DM envoyé à **" + client.users.get(playerId).username + "** :\n\n>>> " + finalmessage + "");
        }).catch(err => {
            message.channel.send(":x: | La personne a désactivé ses messages privés !")
        });

    }
};

/**
 * Test if the person who sent the message is the owner of the bot or a support member.
 * @returns {boolean} - A boolean containing false if the user is the owner.
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
function userIsNotTheOwnerOfTheBotOrASupportMember(message) {
    return message.author.id != Config.BOT_OWNER_ID && !Config.SUPPORT_ID.includes(message.author.id);
}



module.exports.SendCommand = sendCommand;


