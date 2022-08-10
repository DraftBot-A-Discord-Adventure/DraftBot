const {Entities} = require("../../../../core/database/game/models/Entity");
module.exports.commandInfo = {
	name: "resetDailyMission",
	commandFormat: "",
	aliases: ["rdm"],
	messageWhenExecuted: "Votre mission quotidienne a été réinitiliasée !",
	description: "Permet de réinitialiser la mission quootidienne",
	commandTestShouldReply: true
};

/**
 * Set the weapon of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const resetDailyMissionTextCommand = async (language, interaction) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	entity.Player.PlayerMissionsInfo.dailyMissionNumberDone = 0;
	entity.Player.PlayerMissionsInfo.lastDailyMissionCompleted = 0;
	await entity.Player.PlayerMissionsInfo.save();
	return module.exports.commandInfo.messageWhenExecuted;
};

module.exports.execute = resetDailyMissionTextCommand;