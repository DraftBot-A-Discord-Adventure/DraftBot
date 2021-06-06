/**
 * Allow an admin to change the prefix the bot use in a specific server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */

const changeLanguageCommand = async function (language, message) {
	if (await canPerformCommand(message, language,
		PERMISSION.ROLE.ADMINISTRATOR) !== true) {
		return;
	}
	const embed = new discord.MessageEmbed();
	let server;

	[server] = await Servers.getOrRegister(message.guild.id);
	if (server.language === LANGUAGE.FRENCH) {
		server.language = LANGUAGE.ENGLISH;
	} else {
		server.language = LANGUAGE.FRENCH;
	}
	embed.setColor(JsonReader.bot.embed.default)
		.setAuthor(format(
			JsonReader.commands.changeLanguage.getTranslation(language).title,
			{pseudo: message.author.username}),
		message.author.displayAvatarURL())
		.setDescription(JsonReader.commands.changeLanguage.getTranslation(language).desc);
	message.channel.send(embed);
	await server.save();
};

module.exports = {
	commands: [
		{
			name: "language",
			func: changeLanguageCommand
		}
	]
};


