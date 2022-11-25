import {WitchEvent} from "../WitchEvent";
import {RandomUtils} from "../../utils/RandomUtils";
import {Constants} from "../../Constants";
import {ItemConstants} from "../../constants/ItemConstants";
import {SmallEventConstants} from "../../constants/SmallEventConstants";
import {GenericItemModel} from "../../database/game/models/GenericItemModel";
import {generateRandomItem} from "../../utils/ItemUtils";

/**
 * The bat can give a potion of time or of speed or nothing
 */
export default class Bat extends WitchEvent {

	public constructor() {
		super("bat");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.setOutcomeProbabilities(40, 0, 0, 10);
	}

	/**
	 * The bat will give either a speed potion or a time potion with a special maximum rarity.
	 */
	async generatePotion(): Promise<GenericItemModel> {
		return await generateRandomItem(
			ItemConstants.CATEGORIES.POTION,
			null,
			ItemConstants.RARITY.SPECIAL,
			RandomUtils.draftbotRandom.bool(0.625) ? Constants.ITEM_NATURE.SPEED : Constants.ITEM_NATURE.TIME_SPEEDUP
		);
	}
}
