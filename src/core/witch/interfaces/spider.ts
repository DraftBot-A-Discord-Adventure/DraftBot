import {WitchEvent} from "../WitchEvent";
import {generateRandomItem} from "../../utils/ItemUtils";
import {Constants} from "../../Constants";
import {ItemConstants} from "../../constants/ItemConstants";
import {SmallEventConstants} from "../../constants/SmallEventConstants";
import {GenericItemModel} from "../../database/game/models/GenericItemModel";

/**
 * The spider will sometimes give an attack potion.
 */
export default class Spider extends WitchEvent {

	public constructor() {
		super("spider");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.setOutcomeProbabilities(15, 0, 0, 35);
	}

	/**
	 * The spider will give an attack potion with a common maximum rarity.
	 */
	async generatePotion(): Promise<GenericItemModel> {
		return await generateRandomItem(
			ItemConstants.CATEGORIES.POTION,
			ItemConstants.RARITY.COMMON,
			ItemConstants.RARITY.COMMON,
			Constants.ITEM_NATURE.ATTACK
		);
	}
}
