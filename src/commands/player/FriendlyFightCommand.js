module.exports.help = {
	name: "friendlyfight",
	aliases: ["ff", "ffight"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED],
	requiredLevel: FIGHT.REQUIRED_LEVEL
};

/**
 * Displays information about the profile of the player who sent the command
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @param {boolean} friendly - If the fight is a friendly fight
 */
const FriendlyFightCommand = async function(message, language, args) {
	await getCommandFromAlias("f").execute(message, language, args, true);
};

module.exports.execute = FriendlyFightCommand;
