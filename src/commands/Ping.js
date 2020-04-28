/**
 * Display the ping of the bot and allow user to check if the bot is online
 * @param {string} serverLanguage
 * @param {*} message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param {[string]} args - arguments typed by the user in addition to the command
 * @return {Promise<void>}
 */
const PingCommand = async function (serverLanguage, message, args) {
    let pingMessage = Config.text[serverLanguage].commands.ping.main;

    message.channel.send(pingMessage)
        .then(msg => {
            msg.edit(pingMessage + " | " + (msg.createdTimestamp - message.createdTimestamp) + " ms");
        });
};

module.exports.PingCommand = PingCommand;
