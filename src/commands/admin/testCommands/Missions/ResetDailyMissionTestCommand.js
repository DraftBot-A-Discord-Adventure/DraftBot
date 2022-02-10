const {Entities} = require("../../../../core/models/Entity");
module.exports.commandInfo = {
	name: "resetDailyMission",
	commandFormat: "",
	aliases: ["rdm"],
	messageWhenExecuted: "Votre mission quotidienne a été réinitiliasée !",
	description: "Permet de réinitialiser la mission quootidienne"
};

/**
 * Set the weapon of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const resetDailyMissionTextCommand = async (language, message) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	entity.Player.PlayerMissionsInfo.dailyMissionNumberDone = 0;
	entity.Player.PlayerMissionsInfo.lastDailyMissionCompleted = 0;
	await entity.Player.PlayerMissionsInfo.save();
	return module.exports.commandInfo.messageWhenExecuted;
};

module.exports.execute = resetDailyMissionTextCommand;