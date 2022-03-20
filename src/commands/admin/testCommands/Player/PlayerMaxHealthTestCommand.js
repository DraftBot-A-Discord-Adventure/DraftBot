import {Entities} from "../../../../core/models/Entity";

module.exports.commandInfo = {
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
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const playerMaxHealthTestCommand = async (language, interaction, args) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	if (args[0] <= 0) {
		throw new Error("Erreur score : maxhealth donné inférieur à 0 interdit !");
	}
	entity.maxHealth = parseInt(args[0], 10);
	await entity.save();

	return format(module.exports.commandInfo.messageWhenExecuted, {maxhealth: entity.maxHealth});
};

module.exports.execute = playerMaxHealthTestCommand;