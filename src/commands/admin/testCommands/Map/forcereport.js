module.exports.infos = {
	name: "forcereport",
	aliases: ["fr", "forcer"],
	commandFormat: "<id>",
	typeWaited: {
		id: typeVariable.INTEGER
	},
	messageWhenExecuted: "Event {id} forcé !",
	description: "Force un rapport donné"
};

const CT = require("../../../../core/CommandsTest");

/**
 * Force an report with a given event id
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
async function forcereport(language, message, args) {
	const idMaxEvents = await Events.getIdMaxEvents();
	if ((args[0] > idMaxEvents || args[0] <= 0) && args[0] !== "-1") {
		throw new Error("Erreur forcereport : id invalide ! Id d'event attendu -1 ou compris entre 1 et " + idMaxEvents);
	}
	await CT.getTestCommand("atravel").execute(language, message,["1560"]);
	getCommandFromAlias("r").execute(message, language, [], parseInt(args[0]));
	return format(module.exports.infos.messageWhenExecuted,{id: args[0] === "-1" ? "aléatoire" : args[0]});
}

module.exports.execute = forcereport;