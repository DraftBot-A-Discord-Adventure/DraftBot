/**
 * Allow an admin to change the prefix the bot use in a specific server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */

const ChangePrefixCommand = async function (language, message, args) {
	if (await canPerformCommand(message, language,
		PERMISSION.ROLE.ADMINISTRATOR) !== true) {
		return;
	}

	const embed = new discord.MessageEmbed();
	const newPrefix = args[0];
	let server;
	[server] = await Servers.getOrRegister(message.guild.id);
	if (newPrefix === undefined) {
		return sendErrorMessage(message.author, message.channel, language, format(
			JsonReader.commands.changePrefix.getTranslation(language).descError,
			{oldPrefix: server.prefix})
		);
	}

	server.prefix = newPrefix;
	await server.save();
	embed.setColor(JsonReader.bot.embed.default)
		.setAuthor(format(JsonReader.commands.changePrefix.getTranslation(language).ok, {pseudo: message.author.username}), message.author.displayAvatarURL())
		.setDescription(format(JsonReader.commands.changePrefix.getTranslation(language).descOk, {newPrefix: newPrefix}));
	return await message.channel.send(embed);
};

module.exports = {
	commands: [
		{
			name: "prefix",
			func: ChangePrefixCommand,
			aliases: ["prefix"]
		}
	]
};


