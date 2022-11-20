import {WitchEvent} from "../WitchEvent";
import {generateRandomPotion} from "../../utils/ItemUtils";
import {Constants} from "../../Constants";
import {ItemConstants} from "../../constants/ItemConstants";
import Potion from "../../database/game/models/Potion";
import {SmallEventConstants} from "../../constants/SmallEventConstants";

export default class Heart extends WitchEvent {

	public constructor() {
		super("heart");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.setOutcomeProbabilities(50, 0, 0, 0);
	}

	/**
	 * The heart will give a health potion with a legendary maximum rarity.
	 */
	async generatePotion(): Promise<Potion> {
		return await generateRandomPotion(
			Constants.ITEM_NATURE.HEALTH,
			ItemConstants.RARITY.LEGENDARY);
	}
}
