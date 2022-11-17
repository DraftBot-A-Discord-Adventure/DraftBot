import {WitchEvent} from "../../WitchEvent";
import Player from "../../../database/game/models/Player";
import {TravelTime} from "../../../maps/TravelTime";
import {EffectsConstants} from "../../../constants/EffectsConstants";
import {NumberChangeReason} from "../../../constants/LogsConstants";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";

export default class Beer extends WitchEvent {

	public constructor() {
		super("beer");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.setOutcomeProbabilities(0, 25, 0, 25);
	}

	/**
	 * The beer can make the player drunk
	 * @param player
	 */
	async giveEffect(player: Player): Promise<void> {
		await TravelTime.applyEffect(
			player,
			EffectsConstants.EMOJI_TEXT.DRUNK,
			0,
			new Date(),
			NumberChangeReason.SMALL_EVENT,
			new Date()
		);
	}

}
