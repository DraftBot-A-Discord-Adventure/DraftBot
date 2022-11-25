import {WitchEvent} from "../WitchEvent";

import Player from "../../database/game/models/Player";
import {generateRandomItem} from "../../utils/ItemUtils";
import {Constants} from "../../Constants";
import {TravelTime} from "../../maps/TravelTime";
import {EffectsConstants} from "../../constants/EffectsConstants";
import {NumberChangeReason} from "../../constants/LogsConstants";
import {ItemConstants} from "../../constants/ItemConstants";
import {SmallEventConstants} from "../../constants/SmallEventConstants";
import {GenericItemModel} from "../../database/game/models/GenericItemModel";

/**
 * The scorpion will do nothing or give an attack potion or hurt the player.
 */
export default class Scorpion extends WitchEvent {

	public constructor() {
		super("scorpion");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.effectName = "sick";
		this.setOutcomeProbabilities(35, 5, 0, 10);
	}

	/**
	 * The scorpion will give an attack potion with a rare maximum rarity.
	 */
	async generatePotion(): Promise<GenericItemModel> {
		return await generateRandomItem(
			ItemConstants.CATEGORIES.POTION,
			null,
			ItemConstants.RARITY.RARE,
			Constants.ITEM_NATURE.ATTACK
		);
	}

	/**
	 * The scorpion can make the player sick.
	 * @param player
	 */
	async giveEffect(player: Player): Promise<void> {
		await TravelTime.applyEffect(
			player,
			EffectsConstants.EMOJI_TEXT.SICK,
			this.timePenalty,
			new Date(),
			NumberChangeReason.SMALL_EVENT
		);
	}

}
