import {Entities} from "../../../../core/models/Entity";

module.exports.commandInfo = {
	name: "defense",
	commandFormat: "<defense>",
	typeWaited: {
		defense: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {defense} :shield:!",
	description: "Mets la défense de votre joueur à la valeur donnée"
};

/**
 * Set the defense of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const defenseTestCommand = async (language, interaction, args) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	if (args[0] < 0) {
		throw new Error("Erreur defense : defense donné inférieur à 0 interdit !");
	}
	entity.defense = parseInt(args[0], 10);
	await entity.save();

	return format(module.exports.commandInfo.messageWhenExecuted, {defense: entity.defense});
};

module.exports.execute = defenseTestCommand;