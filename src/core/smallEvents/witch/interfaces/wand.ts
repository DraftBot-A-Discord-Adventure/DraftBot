import {WitchEvent} from "../WitchEvent";
import Player from "../../../database/game/models/Player";
import {TravelTime} from "../../../maps/TravelTime";
import {EffectsConstants} from "../../../constants/EffectsConstants";
import {NumberChangeReason} from "../../../constants/LogsConstants";
import {ItemConstants} from "../../../constants/ItemConstants";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";
import {GenericItemModel} from "../../../database/game/models/GenericItemModel";
import {generateRandomItem} from "../../../utils/ItemUtils";

/**
 * The wand will give a pretty good random potion but cost time
 */
export default class Wand extends WitchEvent {

	public constructor() {
		super("wand");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.ADVICE;
		this.setOutcomeProbabilities(50, 0, 0, 0);
		this.forceEffect = true;
		this.timePenalty = 50;
	}

	/**
	 * The wand will give a random potion with an epic maximum rarity and a rare minimum rarity.
	 */
	async generatePotion(): Promise<GenericItemModel> {
		return await generateRandomItem(
			ItemConstants.CATEGORIES.POTION,
			ItemConstants.RARITY.RARE,
			ItemConstants.RARITY.EPIC
		);
	}

	/**
	 * The wand will make the player occupied for 1 hour.
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