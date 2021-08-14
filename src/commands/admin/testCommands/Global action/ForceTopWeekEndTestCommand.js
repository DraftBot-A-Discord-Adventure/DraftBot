module.exports.commandInfo = {
	name: "forcetopweekend",
	aliases: ["forcetwe"],
	commandFormat: "",
	messageWhenExecuted: "Vous avez effectué une fin de topweek !",
	description: "Effectue une fin de topweek (action hebdomadaire qui réinitialise le topweek, et qui annonce le gagnant de la semaine)"
};

const DB = require("../../../../core/DraftBot");

/**
 * Force a topweek end event
 * @return {String} - The successful message formatted
 */
const forceTopWeekEndTestCommand = async () => {
	await DB.twe();

	return module.exports.commandInfo.messageWhenExecuted;
};

module.exports.execute = forceTopWeekEndTestCommand;