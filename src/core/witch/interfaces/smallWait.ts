import {WitchEvent} from "../WitchEvent";
import Player from "../../database/game/models/Player";
import {TravelTime} from "../../maps/TravelTime";
import {EffectsConstants} from "../../constants/EffectsConstants";
import {NumberChangeReason} from "../../constants/LogsConstants";
import {SmallEventConstants} from "../../constants/SmallEventConstants";

export default class SmallWait extends WitchEvent {

	public constructor() {
		super("smallWait");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.ADVICE;
		this.setOutcomeProbabilities(0, 0, 0, 50);
		this.forceEffect = true;
	}

	/**
	 * The small wait will force the player to wait for 15 minutes.
	 * @param player
	 */
	async giveEffect(player: Player): Promise<void> {
		await TravelTime.applyEffect(
			player,
			EffectsConstants.EMOJI_TEXT.OCCUPIED,
			15,
			new Date(),
			NumberChangeReason.SMALL_EVENT
		);
	}
}