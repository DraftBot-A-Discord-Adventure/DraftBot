module.exports.help = {
	name: "idea",
	aliases: ["ideas","suggestions","suggestion","suggest"]
};

/**
 * Displays the link for the idea board
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const IdeaCommand = (message, language) => {
	const ideaEmbed = new discord.MessageEmbed()
		.setDescription(JsonReader.commands.idea.getTranslation(language).text)
		.setTitle(JsonReader.commands.idea.getTranslation(language).title)
		.setColor(JsonReader.bot.embed.default);
	message.channel.send(ideaEmbed);
};

module.exports.execute = IdeaCommand;