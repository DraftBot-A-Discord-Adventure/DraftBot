import {WitchEvent} from "../WitchEvent";
import {RandomUtils} from "../../../utils/RandomUtils";
import {Constants} from "../../../Constants";
import {ItemConstants} from "../../../constants/ItemConstants";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";
import {GenericItemModel} from "../../../database/game/models/GenericItemModel";
import {generateRandomItem} from "../../../utils/ItemUtils";

/**
 * The frog will give a time or speed potion or nothing.
 */
export default class Frog extends WitchEvent {

	public constructor() {
		super("frog");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.setOutcomeProbabilities(30, 0, 0, 20);
	}

	/**
	 * The frog will give either a speed potion or a time potion with a rare maximum rarity.
	 */
	async generatePotion(): Promise<GenericItemModel> {
		return await generateRandomItem(
			ItemConstants.CATEGORIES.POTION,
			ItemConstants.RARITY.RARE,
			ItemConstants.RARITY.RARE,
			RandomUtils.draftbotRandom.bool() ? Constants.ITEM_NATURE.SPEED : Constants.ITEM_NATURE.TIME_SPEEDUP
		);
	}
}
