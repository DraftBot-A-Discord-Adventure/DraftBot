import {WitchEvent} from "../WitchEvent";
import {generateRandomPotion} from "../../utils/ItemUtils";
import {Constants} from "../../Constants";
import {ItemConstants} from "../../constants/ItemConstants";
import {SmallEventConstants} from "../../constants/SmallEventConstants";
import {GenericItemModel} from "../../database/game/models/GenericItemModel";

/**
 * The mushroom will give a health potion sometimes. or hurt the player (50 50)
 */
export default class Mushroom extends WitchEvent {

	public constructor() {
		super("mushroom");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.setOutcomeProbabilities(25, 0, 25, 0);
	}

	/**
	 * The mushroom will give a health potion with an uncommon maximum rarity.
	 */
	static async generatePotion(): Promise<GenericItemModel> {
		return await generateRandomPotion(
			Constants.ITEM_NATURE.HEALTH,
			ItemConstants.RARITY.UNCOMMON);
	}
}
