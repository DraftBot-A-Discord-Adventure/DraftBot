module.exports.help = {
	name: "playermaxhealth",
	aliases: ["maxhealth"],
	commandFormat: "<maxhealth>",
	typeWaited: {
		maxhealth: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {maxhealth} :heart: au maximum !",
	description: "Mets la vie maximale de votre joueur à la valeur donnée"
};

/**
 * Set the maxhealth of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const playerMaxHealthTestCommand = async (language, message, args) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	if (args[0] <= 0) {
		throw new Error("Erreur score : maxhealth donné inférieur à 0 interdit !");
	}
	entity.maxhealth = parseInt(args[0],10);
	entity.save();

	return format(module.exports.help.messageWhenExecuted, {maxhealth: entity.maxhealth});
};

module.exports.execute = playerMaxHealthTestCommand;