import {WitchEvent} from "../WitchEvent";
import Player from "../../database/game/models/Player";
import {Constants} from "../../Constants";
import {TravelTime} from "../../maps/TravelTime";
import {EffectsConstants} from "../../constants/EffectsConstants";
import {NumberChangeReason} from "../../constants/LogsConstants";
import {ItemConstants} from "../../constants/ItemConstants";
import {SmallEventConstants} from "../../constants/SmallEventConstants";
import {GenericItemModel} from "../../database/game/models/GenericItemModel";
import {generateRandomItem} from "../../utils/ItemUtils";

/**
 * The distiller will give a time potion but cost time
 */
export default class Distiller extends WitchEvent {

	public constructor() {
		super("distiller");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.ADVICE;
		this.setOutcomeProbabilities(50, 0, 0, 0);
		this.forceEffect = true;
		this.timePenalty = 55;
	}

	/**
	 * The distiller will give a time skip potion with a legendary maximum rarity.
	 */
	async generatePotion(): Promise<GenericItemModel> {
		return await generateRandomItem(
			ItemConstants.CATEGORIES.POTION,
			ItemConstants.RARITY.RARE,
			ItemConstants.RARITY.LEGENDARY,
			Constants.ITEM_NATURE.TIME_SPEEDUP
		);
	}

	/**
	 * The distiller will make the player lose 55 minutes.
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