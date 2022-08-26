import {Entities} from "../../../../core/database/game/models/Entity";

/**
 * Print missions info
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const expireMissionsTestCommand = async (language, interaction) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	for (const mission of entity.Player.MissionSlots) {
		if (!mission.isCampaign()) {
			mission.expiresAt = new Date(1);
			await mission.save();
		}
	}
	return module.exports.commandInfo.messageWhenExecuted;
};

module.exports.commandInfo = {
	name: "expireMissions",
	commandFormat: "",
	messageWhenExecuted: "Toutes les missions ont expiré",
	description: "Expire toutes les missions",
	commandTestShouldReply: true,
	execute: expireMissionsTestCommand
};

