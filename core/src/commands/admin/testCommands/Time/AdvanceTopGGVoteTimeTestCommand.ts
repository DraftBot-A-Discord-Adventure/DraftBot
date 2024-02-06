import {ExecuteTestCommandLike, ITestCommand, TypeKey} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "advancetopggvotetime",
	aliases: ["topggatime"],
	commandFormat: "<time>",
	typeWaited: {
		time: TypeKey.INTEGER
	},
	description: "Avance le dernier vote top.gg de votre joueur d'une durée en minutes donnée"
};

/**
 * Quick travel your topgg vote time of a given time
 */
const advanceTopGGVoteTimeTestCommand: ExecuteTestCommandLike = async (player, args) => {
	player.topggVoteAt = new Date(player.topggVoteAt.valueOf() - parseInt(args[0], 10) * 60000);
	await player.save();
	return `Vous avez avancé votre dernier vote top.gg de ${args[0]} minutes !`;
};

commandInfo.execute = advanceTopGGVoteTimeTestCommand;
