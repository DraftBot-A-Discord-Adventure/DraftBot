const Config = require('../../utils/Config');

/**
 * Allow an admin to recover the database
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const sendDataCommand = async function (message, args) {
    if (userIsNotTheOwnerOfTheBot(message)) { // the author of the command is not the owner of the bot
        return console.log(message.author.username + " tried to use an admin command");
    } else { // the author of the command is the author of the bot
        message.channel.send({
            files: [{
                attachment: './modules/data/database.sqlite',
                name: 'data.sqlite'
            }]
        })
            .catch(console.error);
    };
}

/**
 * Test if the person who sent the message is the owner of the bot.
 * @returns {boolean} - A boolean containing false if the user is the owner.
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
function userIsNotTheOwnerOfTheBot(message) {
    return message.author.id != Config.BOT_OWNER_ID;
}



module.exports.SendDataCommand = sendDataCommand;


