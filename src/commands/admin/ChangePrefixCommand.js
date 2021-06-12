/**
 * Allow an admin to change the prefix the bot use in a specific server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

const ChangePrefixCommand = async function(language, message, args) {
	if (await canPerformCommand(message, language,
		PERMISSION.ROLE.ADMINISTRATOR) !== true) {
		return;
	}

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
	return await message.channel.send(new DraftBotEmbed()
		.formatAuthor(JsonReader.commands.changePrefix.getTranslation(language).ok, message.author)
		.setDescription(format(JsonReader.commands.changePrefix.getTranslation(language).descOk,
			{newPrefix: newPrefix}
		)));
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


