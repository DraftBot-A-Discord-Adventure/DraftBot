import {WitchEvent} from "../WitchEvent";
import {generateRandomPotion} from "../../utils/ItemUtils";
import {Constants} from "../../Constants";
import {ItemConstants} from "../../constants/ItemConstants";
import {SmallEventConstants} from "../../constants/SmallEventConstants";
import {GenericItemModel} from "../../database/game/models/GenericItemModel";

/**
 * The snake will give an attack potion sometimes.
 */
export default class Snake extends WitchEvent {

	public constructor() {
		super("snake");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.setOutcomeProbabilities(30, 0, 0, 20);
	}

	/**
	 * The snake will give an attack potion with a rare maximum rarity.
	 */
	static async generatePotion(): Promise<GenericItemModel> {
		return await generateRandomPotion(
			Constants.ITEM_NATURE.ATTACK,
			ItemConstants.RARITY.RARE);
	}
}
