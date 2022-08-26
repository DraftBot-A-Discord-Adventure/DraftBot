import {Entities} from "../../../../core/database/game/models/Entity";

/**
 * Give a badge to your player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const giveBadgeTestCommand = async (language, interaction, args) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	entity.Player.addBadge(args[0]);
	await entity.Player.save();

	return format(module.exports.commandInfo.messageWhenExecuted, {badge: args[0]});
};

module.exports.commandInfo = {
	name: "givebadge",
	commandFormat: "<badge>",
	typeWaited: {
		badge: typeVariable.EMOJI
	},
	messageWhenExecuted: "Vous avez maintenant le badge {badge} !",
	description: "Donne un badge à votre joueur",
	commandTestShouldReply: true,
	execute: giveBadgeTestCommand
};