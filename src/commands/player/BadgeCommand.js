module.exports.help = {
	name: "badge",
	aliases: ["badges"]
};

/**
 * Allow to use the object if the player has one in the dedicated slot of his inventory
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 */
const BadgeCommand = (language, message) => {
	getCommand("help")(language, message, ["badge"]);
};

module.exports.execute = BadgeCommand;