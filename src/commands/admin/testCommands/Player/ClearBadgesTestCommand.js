import {Entities} from "../../../../core/database/game/models/Entity";

/**
 * Delete all badges of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const clearBadgesTestCommand = async (language, interaction) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	entity.Player.badges = null;
	await entity.Player.save();

	return module.exports.commandInfo.messageWhenExecuted;
};

module.exports.commandInfo = {
	name: "clearbadges",
	commandFormat: "",
	messageWhenExecuted: "Vous avez supprimé vos badges !",
	description: "Supprime les badges de votre joueur",
	commandTestShouldReply: true,
	execute: clearBadgesTestCommand
};