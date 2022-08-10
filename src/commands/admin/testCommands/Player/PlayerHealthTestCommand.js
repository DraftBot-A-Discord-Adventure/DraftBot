import {Entities} from "../../../../core/database/game/models/Entity";

module.exports.commandInfo = {
	name: "playerhealth",
	aliases: ["health"],
	commandFormat: "<health>",
	typeWaited: {
		health: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {health} :heart:!",
	description: "Mets la vie de votre joueur à la valeur donnée",
	commandTestShouldReply: true
};

/**
 * Set the health of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const playerHealthTestCommand = async (language, interaction, args) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	if (args[0] < 0) {
		throw new Error("Erreur experience : experience donné inférieur à 0 interdit !");
	}
	entity.health = parseInt(args[0], 10);
	await entity.save();

	return format(module.exports.commandInfo.messageWhenExecuted, {health: entity.health});
};

module.exports.execute = playerHealthTestCommand;