import {Entities} from "../../../../core/database/game/models/Entity";

/**
 * Set fightpointslost of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const fightPointsLostTestCommand = async (language, interaction, args) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	entity.fightPointsLost = parseInt(args[0], 10);
	await entity.save();

	return format(module.exports.commandInfo.messageWhenExecuted, {lostPoints: args[0]});
};

module.exports.commandInfo = {
	name: "fightpointslost",
	aliases: ["fpl"],
	commandFormat: "<lostPoints>",
	typeWaited: {
		lostPoints: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {lostPoints} fightpointslost !",
	description: "Mets les fightpointslost de votre joueur à la valeur donnée",
	commandTestShouldReply: true,
	execute: fightPointsLostTestCommand
};