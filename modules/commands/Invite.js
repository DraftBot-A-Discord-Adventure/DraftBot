const Text = require('../text/Anglais');

/**
 * Display the ping of the bot and allow user to check if the bot is online
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message
 */
const inviteCommand = function (message) {

    let inviteMessage = Text.commands.invite.main;
    message.channel.send(inviteMessage);

};

module.exports.InviteCommand = inviteCommand;
