/**
 * Allow the bot owner to give an item to somebody
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const ChangePointsWeekCommand = async function(language, message, args) {
  if ((await canPerformCommand(message, language,
      PERMISSION.ROLE.BOTOWNER)) !== true) {
    return;
  }

  let embed = new discord.MessageEmbed();
  let entity;
  let playerId = message.mentions.users.last().id;
  [entity] = await Entities.getOrRegister(playerId);
  await entity.Player.setPointsWeek(args[1]);
  await entity.Player.save();

  embed.setColor(JsonReader.bot.embed.default)
      .setAuthor(
          format(JsonReader.commands.pointsWeek.getTranslation(language).title,
              {pseudo: message.author.username}),
          message.author.displayAvatarURL())
      .setDescription(
          format(JsonReader.commands.pointsWeek.getTranslation(language).desc,
              {player: args[0], points: args[1]}));
  return await message.channel.send(embed);
};

module.exports = {
  'pointsw': ChangePointsWeekCommand,
};
