module.exports.commandInfo = {
	name: "topserver",
	aliases: ["ts", "tops", "topserv"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD]
};
/**
 * Allow to display the rankings of the players in author server
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const TopServerCommand = async (message, language, args) => {

	args.unshift("s");
	await getCommandFromAlias("t").execute(message, language, args);
};

module.exports.execute = TopServerCommand;