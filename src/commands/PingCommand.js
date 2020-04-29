/**
 * Displays the ping of the bot and allow the player to check if the bot is online
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const PingCommand = async function (language, message, args) {
  let pingMessage = Config.text[language].commands.ping.main;

  message.channel.send(pingMessage)
    .then(msg => {
      msg.edit(pingMessage + " | " +
        (msg.createdTimestamp - message.createdTimestamp) + " ms");
    });
};

module.exports = {
  "ping": PingCommand
};
