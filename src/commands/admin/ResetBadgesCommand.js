/**
 * Allow the bot owner or a badgemanager to remove all badges from somebody
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

const resetBadgesCommand = async function(language, message) {
	if (await canPerformCommand(message, language, PERMISSION.ROLE.BADGE_MANAGER) !== true) {
		return;
	}
	// the author of the command is the author of the bot
	const playerId = message.mentions.users.last().id;
	[entity] = await Entities.getOrRegister(playerId);

	entity.Player.badges = null;
	await entity.Player.save();

	return await message.channel.send(new DraftBotEmbed()
		.formatAuthor(JsonReader.commands.resetBadgeCommand.getTranslation(language).resetSuccess, message.author))
		.setDescription(format(JsonReader.commands.resetBadgeCommand.getTranslation(language).descReset, {player: message.mentions.users.last()}));
};

module.exports = {
	commands: [
		{
			name: "rb",
			func: resetBadgesCommand
		}
	]
};

