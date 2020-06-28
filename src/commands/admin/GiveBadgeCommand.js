/**
 * Allow the bot owner or a badgemanager to give an item to somebody
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const giveBadgeCommand = async function (language, message, args) {
  if ((await canPerformCommand(message, language, PERMISSION.ROLE.BADGEMANAGER)) !== true) {
    return;
  }
  let embed = new discord.MessageEmbed();
  // the author of the command is the author of the bot
  let playerId = message.mentions.users.last().id;
  [entity] = await Entities.getOrRegister(playerId);

  let author;
  let description;

  if (args[1].length > 1) {
    author = JsonReader.commands.giveBadgeCommand.getTranslation(language).giveSyntaxErr;
    description = JsonReader.commands.giveBadgeCommand.getTranslation(language).descGiveSyntaxErr;

    embed.setColor(JsonReader.bot.embed.default)
      .setAuthor(format(author, { pseudo: message.author.username }), message.author.displayAvatarURL())
      .setDescription(description);
    return await message.channel.send(embed);
  }

  let hasAlreadyBadge = await entity.Player.giveBadge(args[0]);
  await entity.Player.save();

  if (hasAlreadyBadge) {
    author = JsonReader.commands.giveBadgeCommand.getTranslation(language).giveAlready;
    description = JsonReader.commands.giveBadgeCommand.getTranslation(language).descGiveAlready;
  } else if (args[0] == global.ARGUMENTS.RESET) {
    author = JsonReader.commands.giveBadgeCommand.getTranslation(language).giveReset
    description = JsonReader.commands.giveBadgeCommand.getTranslation(language).descGiveReset;
  } else {
    author = JsonReader.commands.giveBadgeCommand.getTranslation(language).giveSuccess;
    description = JsonReader.commands.giveBadgeCommand.getTranslation(language).descGiveSuccess
  }

  embed.setColor(JsonReader.bot.embed.default)
    .setAuthor(format(author, { pseudo: message.author.username }), message.author.displayAvatarURL())
    .setDescription(format(description, { badge: args[0], player: message.mentions.users.last() }));
  return await message.channel.send(embed);
};

module.exports = {
  'gb': giveBadgeCommand,
};

