import {Entities} from "../../../../core/models/Entity";

module.exports.commandInfo = {
	name: "expireMissions",
	commandFormat: "",
	messageWhenExecuted: "Toutes les missions ont expiré",
	description: "Expire toutes les missions"
};

/**
 * Print missions info
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const expireMissionsTestCommand = async (language, message, args) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	for (const mission of entity.Player.MissionSlots) {
		if (!mission.isCampaign()) {
			mission.expiresAt = new Date(1);
			await mission.save();
		}
	}
	return module.exports.commandInfo.messageWhenExecuted;
};

module.exports.execute = expireMissionsTestCommand;
