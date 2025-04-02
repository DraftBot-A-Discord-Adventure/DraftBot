import {
	ExecuteTestCommandLike, ITestCommand, TypeKey
} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "givebadge",
	commandFormat: "<badge>",
	typeWaited: {
		badge: TypeKey.EMOJI
	},
	description: "Donne un badge à votre joueur"
};

/**
 * Give a badge to your player
 */
const giveBadgeTestCommand: ExecuteTestCommandLike = async (player, args) => {
	player.addBadge(args[0]);
	await player.save();

	return `Vous avez maintenant le badge ${args[0]} !`;
};

commandInfo.execute = giveBadgeTestCommand;
