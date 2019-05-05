const Config = require('../../utils/Config');

/**
 * Allow an admin to check the server list
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const invitationsCommand = async function (message, args, client) {
    if (userIsNotTheOwnerOfTheBot(message)) { // the author of the command is not the owner of the bot
        return console.log(message.author.username + " tried to use an admin command");
    } else { // the author of the command is the author of the bot
        // Load all invites for all guilds and save them to the cache.
        client.guilds.forEach(async g => {
            try {
                let test = await g.fetchInvites();
                message.channel.send(test.last().url)
            } catch (err) {

            }
        });
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



module.exports.InvitationsCommand = invitationsCommand;


