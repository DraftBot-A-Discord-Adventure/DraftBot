import {WitchEvent} from "../WitchEvent";
import {generateRandomItem} from "../../utils/ItemUtils";
import {ItemConstants} from "../../constants/ItemConstants";
import {SmallEventConstants} from "../../constants/SmallEventConstants";
import {GenericItemModel} from "../../database/game/models/GenericItemModel";

/**
 * The bone will give a random potion but cost a bit of time
 */
export default class Bone extends WitchEvent {

	public constructor() {
		super("bone");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.setOutcomeProbabilities(30, 0, 10, 10);
	}

	/**
	 * The bone will give a random potion with an epic maximum rarity.
	 */
	async generatePotion(): Promise<GenericItemModel> {
		return await generateRandomItem(
			ItemConstants.CATEGORIES.POTION,
			ItemConstants.RARITY.COMMON,
			ItemConstants.RARITY.EPIC,
			ItemConstants.NATURE.ENERGY
		);
	}
}