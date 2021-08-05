module.exports.commandInfo = {
	name: "petfree",
	aliases: ["pf"],
	commandFormat: "",
	messageWhenExecuted: "Vous avez libéré votre pet de force !",
	description: "Libère votre pet de force, sans prendre en compte le cooldown"
};

/**
 * Same as petfree command, but doesn't care about cooldown
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @return {String} - The successful message formatted
 */
const petFreeTestCommand = async (language, message ) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	if (entity.Player.petId === null) {
		throw new Error("Erreur petfree : vous n'avez pas de pet !");
	}
	entity.Player.petId = null;
	return module.exports.commandInfo.messageWhenExecuted;
};

module.exports.execute = petFreeTestCommand;