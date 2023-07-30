import {WitchEvent} from "../WitchEvent";
import Player from "../../../database/game/models/Player";
import {generateRandomItem} from "../../../utils/ItemUtils";
import {Constants} from "../../../Constants";
import {TravelTime} from "../../../maps/TravelTime";
import {EffectsConstants} from "../../../constants/EffectsConstants";
import {NumberChangeReason} from "../../../constants/LogsConstants";
import {ItemConstants} from "../../../constants/ItemConstants";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";
import {GenericItemModel} from "../../../database/game/models/GenericItemModel";

/**
 * Moving the potion in the ice can make the player frozen or do nothing or give a time potion
 */
export default class Cool extends WitchEvent {

	public constructor() {
		super("cool");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.ADVICE;
		this.effectName = "cold";
		this.setOutcomeProbabilities(20, 15, 0, 15);
	}

	/**
	 * The cool will give a time potion with a special maximum rarity.
	 */
	async generatePotion(): Promise<GenericItemModel> {
		return await generateRandomItem(
			ItemConstants.CATEGORIES.POTION,
			ItemConstants.RARITY.RARE,
			ItemConstants.RARITY.SPECIAL,
			Constants.ITEM_NATURE.TIME_SPEEDUP
		);
	}

	/**
	 * The cool will make the player frozen
	 * @param player
	 */
	async giveEffect(player: Player): Promise<void> {
		await TravelTime.applyEffect(
			player,
			EffectsConstants.EMOJI_TEXT.FROZEN,
			this.timePenalty,
			new Date(),
			NumberChangeReason.SMALL_EVENT
		);
	}
}