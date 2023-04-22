import {FightPetAction} from "../FightPetAction";
import {generateRandomItem} from "../../utils/ItemUtils";
import {ItemConstants} from "../../constants/ItemConstants";
import {SmallEventConstants} from "../../constants/SmallEventConstants";
import {GenericItemModel} from "../../database/game/models/GenericItemModel";

/**
 * The worm will give a random potion but cost a bit of time
 */
export default class Worm extends FightPetAction {

	public constructor() {
		super("worm");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.setOutcomeProbabilities(30, 0, 0, 20);
	}

	/**
	 * The worm will give a random potion with an epic maximum rarity.
	 */
	async generatePotion(): Promise<GenericItemModel> {
		return await generateRandomItem(
			ItemConstants.CATEGORIES.POTION,
			ItemConstants.RARITY.COMMON,
			ItemConstants.RARITY.SPECIAL,
			ItemConstants.NATURE.ENERGY
		);
	}
}