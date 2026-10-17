import { NumberChangeReason } from "../../../../../../Lib/src/constants/LogsConstants";
import {
	ExecuteTestCommandLike, ITestCommand, TypeKey
} from "../../../../core/CommandsTest";
import { TravelTime } from "../../../../core/maps/TravelTime";
import {
	asMinutes, minutesToMilliseconds
} from "../../../../../../Lib/src/utils/TimeUtils";

export const commandInfo: ITestCommand = {
	name: "advancetravel",
	aliases: ["atravel"],
	commandFormat: "<time>",
	typeWaited: { time: TypeKey.INTEGER },
	description: "Fait avancer le temps de voyage du joueur de X minutes, ou son séjour en ville s'il y est arrêté. Permet de simuler la fin d'un déplacement ou un long séjour en ville sans attendre"
};

/**
 * Quick travel your travel of a given time
 */
const advanceTravelTestCommand: ExecuteTestCommandLike = async (player, args) => {
	const minutes = parseInt(args[0], 10);
	if (TravelTime.advanceCityStay(player, minutesToMilliseconds(asMinutes(minutes)))) {
		await player.save();
		return `Vous avez avancé votre séjour en ville de ${minutes} minutes !`;
	}
	await TravelTime.timeTravel(player, minutes, NumberChangeReason.TEST);
	await player.save();
	return `Vous avez avancé votre voyage de ${minutes} minutes !`;
};

commandInfo.execute = advanceTravelTestCommand;
