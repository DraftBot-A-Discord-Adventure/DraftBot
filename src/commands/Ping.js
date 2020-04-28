/**
 * Display the ping of the bot and allow user to check if the bot is online
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param prefix
 * @param client
 * @param args - arguments typed by the user in addition to the command
 * @param serverLanguage
 * @return {Promise<void>}
 */
const PingCommand = async function (message, prefix, client, args, serverLanguage) {
    let pingMessage = Config.text[serverLanguage].commands.ping.main;

    message.channel.send(pingMessage)
        .then(msg => {
            msg.edit(pingMessage + " | " + (msg.createdTimestamp - message.createdTimestamp) + " ms");
        });
};

module.exports.PingCommand = PingCommand;
