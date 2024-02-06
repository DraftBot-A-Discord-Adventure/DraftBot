import {NumberChangeReason} from "../../../../core/constants/LogsConstants";
import {ExecuteTestCommandLike, ITestCommand, TypeKey} from "../../../../core/CommandsTest";
import {EffectsConstants} from "../../../../../../Lib/src/constants/EffectsConstants";
import {TravelTime} from "../../../../core/maps/TravelTime";
import {Players} from "../../../../core/database/game/models/Player";

export const commandInfo: ITestCommand = {
	name: "jailplayer",
	aliases: ["jail"],
	commandFormat: "<id>",
	typeWaited: {
		id: TypeKey.ID
	},
	description: "Enferme le joueur donné"
};

/**
 * Jail the given player
 */
const jailPlayerTestCommand: ExecuteTestCommandLike = async (player, args) => {
	const jailPlayer = await Players.getByKeycloakId(player.keycloakId);
	await TravelTime.applyEffect(jailPlayer, EffectsConstants.EMOJI_TEXT.LOCKED, 0, new Date(), NumberChangeReason.TEST);
	await jailPlayer.save();
	return `Vous avez enfermé ${args[0]} !`;
};

commandInfo.execute = jailPlayerTestCommand;