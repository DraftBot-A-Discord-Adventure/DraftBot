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
	await CT.getTestCommand("atravel").execute(language, message,["1560"]);
	await Command.getCommand("r").execute(message, language, [], args[0]);
	return format(module.exports.infos.messageWhenExecuted,{id: args[0]});
}

module.exports.execute = forcereport;