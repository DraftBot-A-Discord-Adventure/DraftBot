/**
 * Displays commands of the bot for a player, if arg match one command explain that command
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const HelpCommand = async (language, message, args) => {
  const command = getMainCommandFromAlias(args[0]);
  let helpMessage = JsonReader.commands.help.getTranslation(language).commands[command];

  if (helpMessage === undefined) {
    let commandsMsg = "";
    let commandsList = Object.keys(JsonReader.commands.help.getTranslation(language).commands);
    for (let i = 0; i < commandsList.length; ++i) {
      commandsMsg += "`" + commandsList[i] + "`";
      if (i !== commandsList.length - 1) {
        commandsMsg += ", ";
      }
    }
    helpMessage = format(JsonReader.commands.help.getTranslation(language).main,
        {pseudo: message.author.username, commands: commandsMsg });
  }
  else {
    let helpMsgTmp = helpMessage;
    helpMessage = new discord.MessageEmbed()
        .setColor(JsonReader.bot.embed.default)
        .setDescription(helpMsgTmp.description)
        .setTitle(format(JsonReader.commands.help.getTranslation(language).commandEmbedTitle, { emote: helpMsgTmp.emote, cmd: command }));
    helpMessage.addField(JsonReader.commands.help.getTranslation(language).usageFieldTitle, "`" + helpMsgTmp.usage + "`", true);
    const aliases = getAliasesFromCommand(command);
    if (aliases.length !== 0) {
      let aliasField = "";
      for (let i = 0; i < aliases.length; ++i) {
        aliasField += "`" + aliases[i] + "`";
        if (i !== aliases.length - 1) {
          aliasField += ", ";
        }
      }
      helpMessage.addField(aliases.length > 1 ? JsonReader.commands.help.getTranslation(language).aliasesFieldTitle : JsonReader.commands.help.getTranslation(language).aliasFieldTitle, aliasField, true);
    }
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
  commands: [
    {
      name: 'help',
      func: HelpCommand
    }
  ]
};
