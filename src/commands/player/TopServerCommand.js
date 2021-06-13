module.exports.help = {
	name: "topserver",
	aliases: ["ts", "tops", "topserv"]
};

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