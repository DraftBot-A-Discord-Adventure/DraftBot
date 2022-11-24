import {WitchEvent} from "../WitchEvent";
import {generateRandomPotion} from "../../utils/ItemUtils";
import {Constants} from "../../Constants";
import {ItemConstants} from "../../constants/ItemConstants";
import {SmallEventConstants} from "../../constants/SmallEventConstants";
import {GenericItemModel} from "../../database/game/models/GenericItemModel";

/**
 * Chance of healing potion or hurt the player (also chance of nothing)
 */
export default class Rose extends WitchEvent {

	public constructor() {
		super("rose");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.setOutcomeProbabilities(20, 0, 10, 20);
	}

	/**
	 * The rose will give a health potion with an uncommon maximum rarity.
	 */
	static async generatePotion(): Promise<GenericItemModel> {
		return await generateRandomPotion(
			Constants.ITEM_NATURE.HEALTH,
			ItemConstants.RARITY.UNCOMMON);
	}
}
