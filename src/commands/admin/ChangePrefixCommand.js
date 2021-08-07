module.exports.commandInfo = {
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
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

const ChangePrefixCommand = async (message, language, args) => {
	const newPrefix = args[0];
	const [server] = await Servers.getOrRegister(message.guild.id);
	if (newPrefix === undefined) {
		return sendErrorMessage(message.author, message.channel, language, format(
			JsonReader.commands.changePrefix.getTranslation(language).descError,
			{oldPrefix: server.prefix})
		);
	}

	if (isAMention(newPrefix)) {
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.changePrefix.getTranslation(language).noMentionForAPrefix);
	}

	server.prefix = newPrefix;
	await server.save();
	return await message.channel.send(new DraftBotEmbed()
		.formatAuthor(JsonReader.commands.changePrefix.getTranslation(language).ok, message.author)
		.setDescription(format(JsonReader.commands.changePrefix.getTranslation(language).descOk,
			{newPrefix: newPrefix}
		)));
};

module.exports.execute = ChangePrefixCommand;