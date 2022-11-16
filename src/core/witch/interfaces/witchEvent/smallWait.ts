import {WitchEvent} from "../../WitchEvent";
import Player from "../../../database/game/models/Player";
import {TravelTime} from "../../../maps/TravelTime";
import {EffectsConstants} from "../../../constants/EffectsConstants";
import {NumberChangeReason} from "../../../constants/LogsConstants";

export default class SmallWait extends WitchEvent {

	generatePotion(): null {
		return null;
	}

	async giveEffect(player: Player): Promise<void> {
		await TravelTime.applyEffect(
			player,
			EffectsConstants.EMOJI_TEXT.OCCUPIED,
			15,
			new Date(),
			NumberChangeReason.SMALL_EVENT,
			new Date()
		);
	}
}