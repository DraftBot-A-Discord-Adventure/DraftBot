import {
	ExecuteTestCommandLike, ITestCommand, TypeKey
} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "fightpointslost",
	aliases: ["fpl"],
	commandFormat: "<lostPoints>",
	typeWaited: {
		lostPoints: TypeKey.INTEGER
	},
	description: "Mets les fightpointslost de votre joueur à la valeur donnée"
};

/**
 * Set fightpointslost of the player
 */
const energyLostTestCommand: ExecuteTestCommandLike = async (player, args) => {
	player.fightPointsLost = parseInt(args[0], 10);
	await player.save();

	return `Vous avez maintenant ${args[0]} fightpointslost !`;
};

commandInfo.execute = energyLostTestCommand;
