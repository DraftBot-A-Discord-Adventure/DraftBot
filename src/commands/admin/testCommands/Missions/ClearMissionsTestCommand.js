const {Entities} = require("../../../../core/models/Entity");
module.exports.commandInfo = {
	name: "clearMissions",
	commandFormat: "",
	messageWhenExecuted: "Toutes vos missions ont été supprimée !",
	description: "Permet de supprimer toutes ses missions"
};

/**
 * Set the weapon of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const clearMissionsTestCommand = async (language, interaction) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);

	for (const missionSlot of entity.Player.MissionSlots) {
		if (!missionSlot.isCampaign()) {
			await missionSlot.destroy();
		}
	}

	return module.exports.commandInfo.messageWhenExecuted;
};

module.exports.execute = clearMissionsTestCommand;