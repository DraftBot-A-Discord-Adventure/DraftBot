import {WitchEvent} from "../WitchEvent";
import {generateRandomItem} from "../../../utils/ItemUtils";
import {Constants} from "../../../Constants";
import {ItemConstants} from "../../../constants/ItemConstants";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";
import {GenericItemModel} from "../../../database/game/models/GenericItemModel";

/**
 * The red apple will give a health potion sometimes.
 */
export default class RedApple extends WitchEvent {

	public constructor() {
		super("redApple");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.setOutcomeProbabilities(10, 0, 0, 40);
	}

	/**
	 * The red apple will give a health potion with a common maximum rarity.
	 */
	async generatePotion(): Promise<GenericItemModel> {
		return await generateRandomItem(
			ItemConstants.CATEGORIES.POTION,
			ItemConstants.RARITY.COMMON,
			ItemConstants.RARITY.COMMON,
			Constants.ITEM_NATURE.HEALTH
		);
	}
}
