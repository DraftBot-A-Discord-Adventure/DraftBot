import {WitchEvent} from "../WitchEvent";
import {generateRandomItem} from "../../../utils/ItemUtils";
import {Constants} from "../../../Constants";
import {ItemConstants} from "../../../constants/ItemConstants";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";
import {GenericItemModel} from "../../../database/game/models/GenericItemModel";

/**
 * The turtle will give a defense potion sometimes.
 */
export default class Turtle extends WitchEvent {

	public constructor() {
		super("turtle");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.setOutcomeProbabilities(40, 0, 0, 10);
	}

	/**
	 * The turtle will give a defense potion with a special maximum rarity.
	 */
	async generatePotion(): Promise<GenericItemModel> {
		return await generateRandomItem(
			ItemConstants.CATEGORIES.POTION,
			ItemConstants.RARITY.COMMON,
			ItemConstants.RARITY.SPECIAL,
			Constants.ITEM_NATURE.DEFENSE
		);
	}
}
