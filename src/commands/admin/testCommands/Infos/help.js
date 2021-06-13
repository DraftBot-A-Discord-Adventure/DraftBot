module.exports.infos = {
	name: "help",
	aliases: ["h"],
	commandFormat: "<command>",
	typeWaited: {
		command: typeVariable.STRING
	},
	messageWhenExecuted: "Description de la commande {command} : {commandDesc}\nUtilisation : {use}\nArgument(s) attendu(s) : {args}",
	description: "Affiche l'aide pour une commande"
};

const CT = require("../../core/CommandsTest");

/**
 * Help the player about one given test command
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
async function help(language, message, args) {
	// TODO : laisser Eagle le faire !
}

module.exports.execute = help;