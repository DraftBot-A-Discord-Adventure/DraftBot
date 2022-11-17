import {WitchEvent} from "../../WitchEvent";
import Player from "../../../database/game/models/Player";
import {generateRandomPotion} from "../../../utils/ItemUtils";
import {Constants} from "../../../Constants";
import {TravelTime} from "../../../maps/TravelTime";
import {EffectsConstants} from "../../../constants/EffectsConstants";
import {NumberChangeReason} from "../../../constants/LogsConstants";
import Potion from "../../../database/game/models/Potion";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";

export default class BigWait extends WitchEvent {

	public constructor() {
		super("bigwait");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.ADVICE;
		this.setOutcomeProbabilities(15, 0, 0, 35);
		this.forceEffect = true;
	}

	/**
	 * The big wait advice will give a no effect potion.
	 */
	async generatePotion(): Promise<Potion> {
		return await generateRandomPotion(
			Constants.ITEM_NATURE.NO_EFFECT);
	}

	/**
	 * the big wait advice will make the player occupied for 60 minutes
	 * @param player
	 */
	async giveEffect(player: Player): Promise<void> {
		await TravelTime.applyEffect(
			player,
			EffectsConstants.EMOJI_TEXT.OCCUPIED,
			60,
			new Date(),
			NumberChangeReason.SMALL_EVENT,
			new Date()
		);
	}
}