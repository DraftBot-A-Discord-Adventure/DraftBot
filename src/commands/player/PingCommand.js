/**
 * Displays the ping of the bot and allow the player to check if the bot is online
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const PingCommand = async function(language, message, args) {
  message.channel.send(JsonReader.commands.ping.getTranslation(language).create)
      .then((msg) => {
        msg.edit(format(JsonReader.commands.ping.getTranslation(language).edit,
            {timeElasped: (msg.createdTimestamp - message.createdTimestamp)}));
      });
};

module.exports = {
  commands: [
    {
      name: 'ping',
      func: PingCommand
    }
  ]
};
