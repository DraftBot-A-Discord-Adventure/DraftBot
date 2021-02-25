/**
 * Allow the bot owner to give an item to somebody
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const ChangePointsCommand = async function (language, message, args) {
	if ((await canPerformCommand(message, language,
		PERMISSION.ROLE.BOTOWNER)) !== true) {
		return;
	}

	const embed = new discord.MessageEmbed();
	let entity;
	const playerId = message.mentions.users.last().id;
	[entity] = await Entities.getOrRegister(playerId);
	entity.Player.score = parseInt(args[1]);
	await entity.Player.save();

	embed.setColor(JsonReader.bot.embed.default)
		.setAuthor(
			format(JsonReader.commands.points.getTranslation(language).title,
				{pseudo: message.author.username}),
			message.author.displayAvatarURL())
		.setDescription(
			format(JsonReader.commands.points.getTranslation(language).desc,
				{player: args[0], points: args[1]}));
	return await message.channel.send(embed);
};

module.exports = {
	commands: [
		{
			name: 'points',
			func: ChangePointsCommand
		}
	]
};

