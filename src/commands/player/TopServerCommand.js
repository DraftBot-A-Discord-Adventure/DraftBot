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
const TopServerCommand = (message, language) => {
// TODO : Voir avec discord pourquoi le ts marche plus !
	// Morceau de code à retirer
	if (language === "fr") {
		return message.channel.send(":x: Cette commande est désactivée pour le moment suite à un changement de la part de discord dans leur API. Elle sera de retour bientôt !");
	}
	return message.channel.send(":x: This command is broken due to changes in the discord API, We hope to get it back online soon!");
	// fin du morceau de code à retirer

	// args.unshift("s");
	// await topCommand(language, message, args);
};

module.exports.execute = TopServerCommand;