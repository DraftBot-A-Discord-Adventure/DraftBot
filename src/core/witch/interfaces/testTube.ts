import {WitchEvent} from "../WitchEvent";
import {generateRandomItem} from "../../utils/ItemUtils";
import {ItemConstants} from "../../constants/ItemConstants";
import {SmallEventConstants} from "../../constants/SmallEventConstants";
import {GenericItemModel} from "../../database/game/models/GenericItemModel";

/**
 * The test tube will rarely give a random potion.
 */
export default class TestTube extends WitchEvent {

	public constructor() {
		super("testTube");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.setOutcomeProbabilities(25, 0, 0, 25);
	}

	/**
	 * The test tube will give a random potion with a special maximum rarity.
	 */
	async generatePotion(): Promise<GenericItemModel> {
		return await generateRandomItem(
			ItemConstants.CATEGORIES.POTION,
			null,
			ItemConstants.RARITY.SPECIAL
		);
	}
}
