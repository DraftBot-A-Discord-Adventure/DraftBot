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
 * The big warm can give a powerful attack potion or hurt the player or do nothing
 */
export default class BigWarm extends WitchEvent {

	public constructor() {
		super("bigWarm");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.ADVICE;
		this.setOutcomeProbabilities(30, 0, 10, 10);
		this.forceEffect = true;
		this.timePenalty = 30;
	}

	/**
	 * The big warm will give very powerful attack potion.
	 */
	async generatePotion(): Promise<GenericItemModel> {
		return await generateRandomItem(
			ItemConstants.CATEGORIES.POTION,
			ItemConstants.RARITY.EPIC,
			ItemConstants.RARITY.MYTHICAL,
			Constants.ITEM_NATURE.ATTACK
		);
	}

	/**
	 * The big warm advice will make the player occupied for 30 minutes
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