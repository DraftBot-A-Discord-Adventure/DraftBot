import {
	ExecuteTestCommandLike, ITestCommand, TypeKey
} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "advancepetfree",
	aliases: ["apfree"],
	commandFormat: "<time>",
	typeWaited: {
		time: TypeKey.INTEGER
	},
	description: "Avance le dernier petfree de votre joueur d'une durée en minutes donnée"
};

/**
 * Quick travel your petfree of a given time
 */
const advancePetFreeTestCommand: ExecuteTestCommandLike = async (player, args) => {
	player.lastPetFree = new Date(player.lastPetFree.valueOf() - parseInt(args[0], 10) * 60000);
	await player.save();
	return `Vous avez avancé votre dernier petfree de ${args[0]} minutes !`;
};

commandInfo.execute = advancePetFreeTestCommand;
