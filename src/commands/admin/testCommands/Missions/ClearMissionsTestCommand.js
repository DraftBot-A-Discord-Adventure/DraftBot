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
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @return {String} - The successful message formatted
 */
const clearMissionsTestCommand = async (language, message) => {
	const [entity] = await Entities.getOrRegister(message.author.id);

	for (const missionSlot of entity.Player.MissionSlots) {
		if (!missionSlot.isCampaign()) {
			await missionSlot.destroy();
		}
	}

	return module.exports.commandInfo.messageWhenExecuted;
};

module.exports.execute = clearMissionsTestCommand;