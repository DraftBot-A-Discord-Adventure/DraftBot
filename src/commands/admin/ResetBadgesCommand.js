module.exports.help = {
	name: "resetbadge",
	aliases: ["rb"],
	userPermissions: ROLES.USER.BADGE_MANAGER
};

/**
 * Allow the bot owner or a badgemanager to remove all badges from somebody
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

const ResetBadgeCommand = async (message, language) => {
	// the author of the command is the author of the bot
	const playerId = message.mentions.users.last().id;
	[entity] = await Entities.getOrRegister(playerId);

	entity.Player.badges = null;
	await entity.Player.save();

	return await message.channel.send(new DraftBotEmbed()
		.formatAuthor(JsonReader.commands.resetBadgeCommand.getTranslation(language).resetSuccess, message.author))
		.setDescription(format(JsonReader.commands.resetBadgeCommand.getTranslation(language).descReset, {player: message.mentions.users.last()}));
};

module.exports.execute = ResetBadgeCommand;