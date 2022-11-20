import {WitchEvent} from "../WitchEvent";
import Player from "../../database/game/models/Player";
import {generateRandomPotion} from "../../utils/ItemUtils";
import {Constants} from "../../Constants";
import {TravelTime} from "../../maps/TravelTime";
import {EffectsConstants} from "../../constants/EffectsConstants";
import {NumberChangeReason} from "../../constants/LogsConstants";
import {ItemConstants} from "../../constants/ItemConstants";
import {SmallEventConstants} from "../../constants/SmallEventConstants";
import {GenericItemModel} from "../../database/game/models/GenericItemModel";

export default class Cool extends WitchEvent {

	public constructor() {
		super("cool");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.ADVICE;
		this.setOutcomeProbabilities(20, 15, 0, 15);
	}

	/**
	 * The cool will give a time potion with a special maximum rarity.
	 */
	async generatePotion(): Promise<GenericItemModel> {
		return await generateRandomPotion(
			Constants.ITEM_NATURE.TIME_SPEEDUP,
			ItemConstants.RARITY.SPECIAL);
	}

	/**
	 * The cool will make the player frozen
	 * @param player
	 */
	async giveEffect(player: Player): Promise<void> {
		await TravelTime.applyEffect(
			player,
			EffectsConstants.EMOJI_TEXT.FROZEN,
			0,
			new Date(),
			NumberChangeReason.SMALL_EVENT
		);
	}
}