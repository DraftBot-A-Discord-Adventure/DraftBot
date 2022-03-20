import {Entities} from "../../../../core/models/Entity";

module.exports.commandInfo = {
	name: "speed",
	commandFormat: "<speed>",
	typeWaited: {
		speed: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {speed} :rocket:!",
	description: "Mets la vitesse de votre joueur à la valeur donnée"
};

/**
 * Set the speed of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const speedTestCommand = async (language, interaction, args) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	if (args[0] < 0) {
		throw new Error("Erreur speed : speed donné inférieur à 0 interdit !");
	}
	entity.speed = parseInt(args[0], 10);
	await entity.save();

	return format(module.exports.commandInfo.messageWhenExecuted, {speed: entity.speed});
};

module.exports.execute = speedTestCommand;