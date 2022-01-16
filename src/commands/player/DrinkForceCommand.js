module.exports.commandInfo = {
	name: "drinkforce",
	aliases: ["drf", "drforce", "glouglouforce"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD]
};

/**
 * Allow to display the weekly rankings of the players
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const DrinkForceCommand = async (message, language, args) => {
	args.unshift("f");
	await getCommandFromAlias("dr").execute(message, language, args);
};

module.exports.execute = DrinkForceCommand;