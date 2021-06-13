module.exports.infos = {
	name: "attack",
	commandFormat: "<attack>",
	typeWaited: {
		attack: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {attack} :crossed_swords:!",
	description: "Mets l'attaque de votre joueur à la valeur donnée"
};

/**
 * Set the attack of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
async function attack(language, message, args) {
	const [entity] = await Entities.getOrRegister(message.author.id);
	if (args[0] < 0) {
		throw new Error("Erreur attack : attack donné inférieur à 0 interdit !");
	}
	entity.attack = parseInt(args[0]);
	entity.save();

	return format(module.exports.infos.messageWhenExecuted, {attack: entity.attack});
}

module.exports.execute = attack;