const {DraftBot} = require("../../../../core/bot/DraftBot");
module.exports.commandInfo = {
	name: "forcetopweekend",
	aliases: ["forcetwe"],
	commandFormat: "",
	messageWhenExecuted: "Vous avez effectué une fin de topweek !",
	description: "Effectue une fin de topweek (action hebdomadaire qui réinitialise le topweek, et qui annonce le gagnant de la semaine)",
	commandTestShouldReply: true
};

/**
 * Force a topweek end event
 * @return {String} - The successful message formatted
 */
const forceTopWeekEndTestCommand = async () => {
	await DraftBot.topWeekEnd();

	return module.exports.commandInfo.messageWhenExecuted;
};

module.exports.execute = forceTopWeekEndTestCommand;