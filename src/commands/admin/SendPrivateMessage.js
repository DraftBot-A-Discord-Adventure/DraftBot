/**
 * Allow an admin to change the prefix the bot use in a specific server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

const SendPrivateMessage = async function(language, message, args) {
	if (await canPerformCommand(message, language,
		PERMISSION.ROLE.SUPPORT) !== true) {
		return;
	}

	const userId = args[0];
	const messageToSend = args.join(" ").replace(userId, "") +
		format(JsonReader.commands.sendPrivateMessage.getTranslation(language).signature, {
			username: message.author.username
		});
	const user = client.users.cache.get(userId);

	if (userId === undefined || args[1] === undefined) {
		return sendErrorMessage(user, message.channel, language, JsonReader.commands.sendPrivateMessage.getTranslation(language).descError);
	}
	if (user === undefined) {
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.sendPrivateMessage.getTranslation(language).personNotExists);
	}
	const embed = new DraftBotEmbed()
		.formatAuthor(JsonReader.commands.sendPrivateMessage.getTranslation(language).title, user)
		.setDescription(messageToSend)
		.setImage(message.attachments.size > 0 ? [...message.attachments.values()][0].url : "");

	message.delete();
	try {
		await user.send(messageToSend);
		sendMessageAttachments(message, user);
		return await message.channel.send(embed);
	}
	catch {
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.sendPrivateMessage.getTranslation(language).errorCannotSend);
	}
};

module.exports = {
	commands: [
		{
			name: "dm",
			func: SendPrivateMessage
		}
	]
};
