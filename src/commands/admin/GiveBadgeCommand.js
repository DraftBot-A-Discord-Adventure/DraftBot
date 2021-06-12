/**
 * Allow the bot owner or a badgemanager to give an item to somebody
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

const giveBadgeCommand = async function(language, message, args) {
	if (await canPerformCommand(message, language, PERMISSION.ROLE.BADGE_MANAGER) !== true) {
		return;
	}

	if (message.mentions.users.last() === undefined) {
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.giveBadgeCommand.getTranslation(language).descError);
	}
	const playerId = message.mentions.users.last().id;
	[entity] = await Entities.getOrRegister(playerId);
	await entity.Player.addBadge(args[0]);
	await entity.Player.save();

	return await message.channel.send(new DraftBotEmbed()
		.formatAuthor(JsonReader.commands.giveBadgeCommand.getTranslation(language).giveSuccess, message.author)
		.setDescription(format(JsonReader.commands.giveBadgeCommand.getTranslation(language).descGive, {
			badge: args[0],
			player: message.mentions.users.last()
		})));
};

module.exports = {
	commands: [
		{
			name: "gb",
			func: giveBadgeCommand
		}
	]
};

