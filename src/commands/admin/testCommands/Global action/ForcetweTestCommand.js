module.exports.help = {
	name: "forcetwe",
	commandFormat: "",
	messageWhenExecuted: "Vous avez effectué une fin de topweek !",
	description: "Effectue une fin de topweek (action hebdomadaire qui réinitialise le topweek, et qui annonce le gagnant de la semaine)"
};

const DB = require("../../../../core/DraftBot");

/**
 * Force a topweek end event
 * @return {String} - The successful message formatted
 */
const forcetwe = async () => {
	await DB.twe();

	return module.exports.help.messageWhenExecuted;
};

module.exports.execute = forcetwe;