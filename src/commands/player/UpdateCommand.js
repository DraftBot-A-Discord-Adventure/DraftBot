module.exports.help = {
	name: "update",
	aliases: ["changelog"]
};

/**
 * Displays the changelog of the bot
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const UpdateCommand = (message, language) => {
	const updateEmbed = new discord.MessageEmbed()
		.setDescription(format(JsonReader.commands.update.getTranslation(language).text,
			{
				version: JsonReader.package.version
			}))
		.setTitle(JsonReader.commands.update.getTranslation(language).title)
		.setColor(JsonReader.bot.embed.default);
	message.channel.send(updateEmbed);
};

module.exports.execute = UpdateCommand;