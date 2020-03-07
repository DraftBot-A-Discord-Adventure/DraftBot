const Config = require('../../utils/Config');

/**
 * Allow an admin to restart the bot
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const resetCommand = async function (message, args, client) {
    if (userIsNotTheOwnerOfTheBot(message)) { // the author of the command is not the owner of the bot
        return console.log(message.author.username + " tried to use an admin command");
    } else { // the author of the command is the author of the bot
        client.guilds.get(Config.MAIN_SERVER_ID).channels.get(Config.CONSOLE_CHANNEL_ID).send(":red_circle: **Bot éteint par commande admin**")
        message.react("👋").then(() => {
            client.destroy();
            client.login(Config.DISCORD_CLIENT_TOKEN);
        })
        console.log("\n\n\n#### BOT ETEINT PAR COMMANDE ADMIN ####\n\n\n")
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


