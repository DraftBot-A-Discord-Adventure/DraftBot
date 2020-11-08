/**
 * Displays commands of the bot for a player, if arg match one command explain that command
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const HelpCommand = async (language, message, args) => {
  const command = getMainCommandFromAlias(args[0]);
  [server] = await Servers.getOrRegister(message.guild.id);
  let helpMessage = JsonReader.commands.help.getTranslation(language).commands[
    command
  ];

  if (helpMessage === undefined) {
    helpMessage = new discord.MessageEmbed();
    let commandsList = Object.entries(
      JsonReader.commands.help.getTranslation(language).commands
    );
    const serverCommands = Object.keys(
      Object.fromEntries(
        commandsList.filter(
          (command) => command[1].category === CATEGORY.SERVER
        )
      )
    );
    const utilCommands = Object.keys(
      Object.fromEntries(
        commandsList.filter((command) => command[1].category === CATEGORY.UTIL)
      )
    );
    const playerCommands = Object.keys(
      Object.fromEntries(
        commandsList.filter(
          (command) => command[1].category === CATEGORY.PLAYER
        )
      )
    ).sort();
    const guildCommands = Object.keys(
      Object.fromEntries(
        commandsList.filter((command) => command[1].category === CATEGORY.GUILD)
      )
    );

    helpMessage.setAuthor(
      format(JsonReader.commands.help.getTranslation(language).helpEmbedTitle, {
        pseudo: message.author.username,
      }),
      message.author.displayAvatarURL()
    );
    helpMessage.setDescription(
      JsonReader.commands.help.getTranslation(language).helpEmbedDescription,
      "\n\u200b"
    );
    helpMessage.addFields([
      {
        name: JsonReader.commands.help.getTranslation(language).serverCommands,
        value: `${serverCommands.sort().join(" • ")}`,
      },
      {
        name: JsonReader.commands.help.getTranslation(language).utilCommands,
        value: `${utilCommands.sort().join(" • ")}`,
      },
      {
        name: JsonReader.commands.help.getTranslation(language).playerCommands,
        value: `${playerCommands.join(" • ")}`,
      },
      {
        name: JsonReader.commands.help.getTranslation(language).guildCommands,
        value: `${guildCommands.sort().join(" • ")} \n\u200b`,
      },
      {
        name: JsonReader.commands.help.getTranslation(language).forMoreHelp,
        value: format(JsonReader.commands.help.getTranslation(language)
          .forMoreHelpValue, { prefix: server.prefix }
        ),
      },
    ]);
  } else {
    let helpMsgTmp = helpMessage;
    helpMessage = new discord.MessageEmbed()
      .setColor(JsonReader.bot.embed.default)
      .setDescription(helpMsgTmp.description)
      .setTitle(
        format(
          JsonReader.commands.help.getTranslation(language).commandEmbedTitle,
          { emote: helpMsgTmp.emote, cmd: command }
        )
      );
    helpMessage.addField(
      JsonReader.commands.help.getTranslation(language).usageFieldTitle,
      "`" + helpMsgTmp.usage + "`",
      true
    );
    const aliases = getAliasesFromCommand(command);
    if (aliases.length !== 0) {
      let aliasField = "";
      for (let i = 0; i < aliases.length; ++i) {
        aliasField += "`" + aliases[i] + "`";
        if (i !== aliases.length - 1) {
          aliasField += ", ";
        }
      }
      helpMessage.addField(
        aliases.length > 1
          ? JsonReader.commands.help.getTranslation(language).aliasesFieldTitle
          : JsonReader.commands.help.getTranslation(language).aliasFieldTitle,
        aliasField,
        true
      );
    }
  }

  if (
    client.guilds.cache
      .get(JsonReader.app.MAIN_SERVER_ID)
      .members.cache.find((val) => val.id === message.author.id) === undefined
  ) {
    await message.author.send(
      JsonReader.commands.help.getTranslation(language).mp
    );
  }

  await message.channel.send(helpMessage);
};

module.exports = {
  commands: [
    {
      name: "help",
      func: HelpCommand,
    },
  ],
};
