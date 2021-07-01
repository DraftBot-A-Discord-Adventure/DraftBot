module.exports.help = {
	name: "prefix",
	aliases: [],
	userPermissions: ROLES.USER.ADMINISTRATOR
};

/**
 * Allow an admin to change the prefix the bot use in a specific server
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const ChangePrefixCommand = async (message, language, args) => {
	const embed = new discord.MessageEmbed();
	const newPrefix = args[0];
	const [server] = await Servers.getOrRegister(message.guild.id);
	if (newPrefix === undefined) {
		return sendErrorMessage(message.author, message.channel, language, format(
			JsonReader.commands.changePrefix.getTranslation(language).descError,
			{oldPrefix: server.prefix})
		);
	}

	server.prefix = newPrefix;
	await server.save();
	embed.setColor(JsonReader.bot.embed.default)
		.setAuthor(format(JsonReader.commands.changePrefix.getTranslation(language).ok,
			{pseudo: message.author.username}), message.author.displayAvatarURL()
		)
		.setDescription(
			format(JsonReader.commands.changePrefix.getTranslation(language).descOk,
				{newPrefix: newPrefix}
			)
		);
	return await message.channel.send(embed);
};

module.exports.execute = ChangePrefixCommand;