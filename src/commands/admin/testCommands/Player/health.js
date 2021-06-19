module.exports.infos = {
	name: "health",
	commandFormat: "<health>",
	typeWaited: {
		health: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {maxhealth} :heart:!",
	description: "Mets la vie de votre joueur à la valeur donnée"
};

/**
 * Set the health of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
async function health(language, message, args) {
	const [entity] = await Entities.getOrRegister(message.author.id);
	if (args[0] < 0) {
		throw new Error("Erreur experience : experience donné inférieur à 0 interdit !");
	}
	entity.health = parseInt(args[0],10);
	entity.save();

	return format(module.exports.infos.messageWhenExecuted, {health: entity.health});
}

module.exports.execute = health;