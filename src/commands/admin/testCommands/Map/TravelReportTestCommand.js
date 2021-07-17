module.exports.commandInfo = {
	name: "travelreport",
	aliases: ["tr"],
	commandFormat: "",
	messageWhenExecuted: "Vous avez réinitialisé votre parcours !",
	description: "Réinitialise le parcours que vous effectuez"
};

const Maps = require("../../../../core/Maps");

/**
 * Reset your current travel
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @return {String} - The successful message formatted
 */
const travelReportTestCommand = async (language, message) => {
	const [entity] = await Entities.getOrRegister(message.author.id);

	if (!Maps.isTravelling(entity.Player)) {
		throw new Error("Erreur travelreport : vous ne voyagez pas actuellement !");
	}

	entity.Player.startTravelDate = new Date();
	entity.Player.effectEndDate = new Date(0);
	await entity.Player.save();

	return module.exports.commandInfo.messageWhenExecuted;

};

module.exports.execute = travelReportTestCommand;