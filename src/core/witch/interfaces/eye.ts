import {WitchEvent} from "../WitchEvent";
import {generateRandomPotion} from "../../utils/ItemUtils";
import {Constants} from "../../Constants";
import {ItemConstants} from "../../constants/ItemConstants";
import {SmallEventConstants} from "../../constants/SmallEventConstants";
import {GenericItemModel} from "../../database/game/models/GenericItemModel";

/**
 * The eye will give a time potion or nothing
 */
export default class Eye extends WitchEvent {

	public constructor() {
		super("eye");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.setOutcomeProbabilities(30, 0, 0, 20);
	}

	/**
	 * The eye will give a time potion with an epic maximum rarity.
	 */
	static async generatePotion(): Promise<GenericItemModel> {
		return await generateRandomPotion(
			Constants.ITEM_NATURE.TIME_SPEEDUP,
			ItemConstants.RARITY.EPIC,
			ItemConstants.RARITY.RARE);
	}
}
