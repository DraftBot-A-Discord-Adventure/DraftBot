module.exports.help = {
	name: "topweek",
	aliases: ["tw", "topw"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD]
};

/**
 * Allow to display the weekly rankings of the players
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const TopWeekCommand = async (message, language, args) => {
	args.unshift("w");
	await getCommandFromAlias("t").execute(message, language, args);
};

module.exports.execute = TopWeekCommand;