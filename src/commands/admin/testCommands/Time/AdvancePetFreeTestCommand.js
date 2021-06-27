module.exports.help = {
	name: "advancepetfree",
	aliases: ["apfree"],
	commandFormat: "<time>",
	typeWaited: {
		time: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez avancé votre dernier petfree de {time} minutes !",
	description: "Avance le dernier petfree de votre joueur d'une durée en minutes donnée"
};

/**
 * Quick travel your petfree of a given time
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const advancePetFreeTestCommand = async (language, message, args) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	entity.Player.lastPetFree -= parseInt(args[0]) * 60000;
	entity.Player.save();
	return format(module.exports.help.messageWhenExecuted, {time: args[0]});
}

module.exports.execute = advancePetFreeTestCommand;