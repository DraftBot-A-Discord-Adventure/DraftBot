import {Entities} from "../../../../core/database/game/models/Entity";

module.exports.commandInfo = {
	name: "playerscore",
	aliases: ["score"],
	commandFormat: "<score>",
	typeWaited: {
		score: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {score} :medal: !",
	description: "Mets le score de votre joueur à la valeur donnée",
	commandTestShouldReply: true
};

/**
 * Set the score of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const playerScoreTestCommand = async (language, interaction, args) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	if (args[0] < 100) {
		throw new Error("Erreur score : score donné inférieur à 100 interdit !");
	}
	await entity.Player.setScore(entity, parseInt(args[0], 10), interaction.channel, language);
	await entity.Player.save();

	return format(module.exports.commandInfo.messageWhenExecuted, {score: entity.Player.score});
};

module.exports.execute = playerScoreTestCommand;