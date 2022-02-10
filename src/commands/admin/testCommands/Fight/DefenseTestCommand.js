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
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const defenseTestCommand = async (language, message, args) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	if (args[0] < 0) {
		throw new Error("Erreur defense : defense donné inférieur à 0 interdit !");
	}
	entity.defense = parseInt(args[0],10);
	entity.save();

	return format(module.exports.commandInfo.messageWhenExecuted, {defense: entity.defense});
};

module.exports.execute = defenseTestCommand;