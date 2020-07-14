/**
 * Displays commands of the bot for a player, if arg match one command explain that command
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const HelpCommand = async (language, message, args) => {
  let helpMessage = JsonReader.commands.help.getTranslation(
      language).commands[args[0]];

  if (helpMessage === undefined) {
    helpMessage = format(JsonReader.commands.help.getTranslation(language).main,
        {pseudo: message.author.username});
  }

  if (client.guilds.cache.get(JsonReader.app.MAIN_SERVER_ID)
      .members
      .cache
      .find((val) => val.id === message.author.id) === undefined) {
    await message.author.send(
        JsonReader.commands.help.getTranslation(language).mp);
  }

  await message.channel.send(helpMessage);
};

module.exports = {
  'help': HelpCommand,
};
