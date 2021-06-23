module.exports.help = {
	name: "score",
	commandFormat: "<score>",
	typeWaited: {
		score: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {score} :medal: !",
	description: "Mets le score de votre joueur à la valeur donnée"
};

/**
 * Set the score of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const score = async (language, message, args) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	if (args[0] < 100) {
		throw new Error("Erreur score : score donné inférieur à 100 interdit !");
	}
	entity.Player.score = parseInt(args[0],10);
	entity.Player.save();

	return format(module.exports.help.messageWhenExecuted, {score: entity.Player.score});
};

module.exports.execute = score;