module.exports.help = {
	name: "pointsw",
	aliases: [],
	userPermissions: ROLES.USER.BOT_OWNER
};

/**
 * Allow the bot owner to give an item to somebody
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const ChangePointsWeekCommand = async (message, language, args) => {
	const embed = new discord.MessageEmbed();
	const playerId = message.mentions.users.last().id;
	const [entity] = await Entities.getOrRegister(playerId);
	entity.Player.weeklyScore = parseInt(args[1]);
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

module.exports.execute = ChangePointsWeekCommand;