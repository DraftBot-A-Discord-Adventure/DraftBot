/**
 * Display the link to invite the bot to another server
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param prefix
 * @param client
 * @param args - arguments typed by the user in addition to the command
 * @param serverLanguage
 * @return {Promise<void>}
 */
const InviteCommand = async function (message, prefix, client, args, serverLanguage) {
    message.channel.send(Config.text[serverLanguage].commands.invite.main);
};

module.exports.InviteCommand = InviteCommand;
