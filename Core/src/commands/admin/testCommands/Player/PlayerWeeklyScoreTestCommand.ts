import {
	ExecuteTestCommandLike, ITestCommand, TypeKey
} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "playerweeklyscore",
	aliases: ["weeklyscore"],
	commandFormat: "<weeklyscore>",
	typeWaited: {
		weeklyscore: TypeKey.INTEGER
	},
	description: "Mets le score de la semaine de votre joueur à la valeur donnée"
};

/**
 * Set the weeklyscore of the player
 */
const playerWeeklyScoreTestCommand: ExecuteTestCommandLike = async (player, args) => {
	player.weeklyScore = parseInt(args[0], 10);
	await player.save();

	return `Vous avez maintenant ${player.weeklyScore} points de la semaine !`;
};

commandInfo.execute = playerWeeklyScoreTestCommand;
