import {WitchEvent} from "../WitchEvent";
import Player from "../../../database/game/models/Player";
import {generateRandomItem} from "../../../utils/ItemUtils";
import {Constants} from "../../../Constants";
import {TravelTime} from "../../../maps/TravelTime";
import {EffectsConstants} from "../../../constants/EffectsConstants";
import {NumberChangeReason} from "../../../constants/LogsConstants";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";
import {GenericItemModel} from "../../../database/game/models/GenericItemModel";
import {ItemConstants} from "../../../constants/ItemConstants";

/**
 * The big wait will do nothing, cost time and can give a no effect potion
 */
export default class BigWait extends WitchEvent {

	public constructor() {
		super("bigWait");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.ADVICE;
		this.setOutcomeProbabilities(15, 0, 0, 35);
		this.forceEffect = true;
		this.timePenalty = 45;
	}

	/**
	 * The big wait advice will give a no effect potion.
	 */
	async generatePotion(): Promise<GenericItemModel> {
		return await generateRandomItem(
			ItemConstants.CATEGORIES.POTION,
			ItemConstants.RARITY.COMMON,
			ItemConstants.RARITY.MYTHICAL,
			Constants.ITEM_NATURE.NO_EFFECT
		);
	}

	/**
	 * the big wait advice will make the player occupied for 60 minutes
	 * @param player
	 */
	async giveEffect(player: Player): Promise<void> {
		await TravelTime.applyEffect(
			player,
			EffectsConstants.EMOJI_TEXT.OCCUPIED,
			this.timePenalty,
			new Date(),
			NumberChangeReason.SMALL_EVENT
		);
	}
}