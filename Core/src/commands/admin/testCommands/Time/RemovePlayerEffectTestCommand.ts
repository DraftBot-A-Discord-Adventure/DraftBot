import { NumberChangeReason } from "../../../../../../Lib/src/constants/LogsConstants";
import {
	ExecuteTestCommandLike, ITestCommand
} from "../../../../core/CommandsTest";
import { TravelTime } from "../../../../core/maps/TravelTime";

export const commandInfo: ITestCommand = {
	name: "removeplayereffect",
	aliases: ["rmeffect"],
	description: "Enlève votre effet actuel"
};

/**
 * Remove the effect of your player
 */
const removePlayerEffectTestCommand: ExecuteTestCommandLike = async player => {
	await TravelTime.removeEffect(player, NumberChangeReason.TEST);
	await player.save();
	return "Vous n'avez plus d'effets !";
};

commandInfo.execute = removePlayerEffectTestCommand;
