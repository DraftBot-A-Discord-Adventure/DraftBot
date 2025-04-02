import { NumberChangeReason } from "../../../../../../Lib/src/constants/LogsConstants";
import {
	ExecuteTestCommandLike, ITestCommand, TypeKey
} from "../../../../core/CommandsTest";
import { TravelTime } from "../../../../core/maps/TravelTime";

export const commandInfo: ITestCommand = {
	name: "advancetravel",
	aliases: ["atravel"],
	commandFormat: "<time>",
	typeWaited: {
		time: TypeKey.INTEGER
	},
	description: "Avance votre voyage d'une durée en minutes donnée"
};

/**
 * Quick travel your travel of a given time
 */
const advanceTravelTestCommand: ExecuteTestCommandLike = async (player, args) => {
	await TravelTime.timeTravel(player, parseInt(args[0], 10), NumberChangeReason.TEST);
	await player.save();
	return `Vous avez avancé votre voyage de ${args[0]} minutes !`;
};

commandInfo.execute = advanceTravelTestCommand;
