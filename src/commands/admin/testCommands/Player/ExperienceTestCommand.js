module.exports.help = {
	name: "experience",
	aliases: ["xp"],
	commandFormat: "<experience>",
	typeWaited: {
		experience: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {experience} :star: !",
	description: "Mets l'expérience votre joueur à la valeur donnée"
};

/**
 * Set the experience of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const experience = async (language, message, args) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	if (args[0] < 0) {
		throw new Error("Erreur experience : experience donné inférieur à 0 interdit !");
	}
	entity.Player.experience = parseInt(args[0],10);
	entity.Player.save();

	return format(module.exports.help.messageWhenExecuted, {experience: entity.Player.experience});
};

module.exports.execute = experience;