import {Entities} from "../../../../core/database/game/models/Entity";

module.exports.commandInfo = {
	name: "petfree",
	aliases: ["pf"],
	commandFormat: "",
	messageWhenExecuted: "Vous avez libéré votre pet de force !",
	description: "Libère votre pet de force, sans prendre en compte le cooldown",
	commandTestShouldReply: true
};

/**
 * Same as petfree command, but doesn't care about cooldown
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const petFreeTestCommand = async (language, interaction) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	if (entity.Player.petId === null) {
		throw new Error("Erreur petfree : vous n'avez pas de pet !");
	}
	entity.Player.petId = null;
	entity.Player.save();
	return module.exports.commandInfo.messageWhenExecuted;
};

module.exports.execute = petFreeTestCommand;