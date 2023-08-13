import {WitchEvent} from "../WitchEvent";
import {generateRandomItem} from "../../../utils/ItemUtils";
import {Constants} from "../../../Constants";
import {ItemConstants} from "../../../constants/ItemConstants";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";
import {GenericItemModel} from "../../../database/game/models/GenericItemModel";

/**
 * The wilted rose is a defense potion with a low probability of being hurt.
 */
export default class WiltedRose extends WitchEvent {

	public constructor() {
		super("wiltedRose");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.setOutcomeProbabilities(20, 0, 10, 20);
	}

	/**
	 * The wilted rose will give a defense potion with an uncommon maximum rarity.
	 */
	async generatePotion(): Promise<GenericItemModel> {
		return await generateRandomItem(
			ItemConstants.CATEGORIES.POTION,
			ItemConstants.RARITY.COMMON,
			ItemConstants.RARITY.UNCOMMON,
			Constants.ITEM_NATURE.DEFENSE
		);
	}
}
