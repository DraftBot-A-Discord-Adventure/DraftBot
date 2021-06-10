module.exports.infos = {
	name: "level",
	aliases: ["lvl"],
	commandFormat: "<niveau>",
	typeWaited: {
		niveau: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous êtes maintenant niveau {level} !",
	description: "Mets votre joueur au niveau donné"
};

/**
 * Set the level of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
function level(language, message, args) {

	message.author.Player.level = parseInt(args[0]);
	message.author.Player.save();

	return format(module.exports.infos.messageWhenExecuted, {level: message.author.Player.level});
}

module.exports.execute = level;