const ServerManager = require('../classes/ServerManager');
let Text

/**
 * Allow to charge the correct text file
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const chargeText = async function (message) {
    let serverManager = new ServerManager();
    let server = await serverManager.getServer(message);
    let address = '../text/' + server.language;
    return require(address);
}

/**
 * Display the ping of the bot and allow user to check if the bot is online
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message
 */
const inviteCommand = async function (message) {
    Text = await chargeText(message);
    let inviteMessage = Text.commands.invite.main;
    message.channel.send(inviteMessage);

};

module.exports.InviteCommand = inviteCommand;
