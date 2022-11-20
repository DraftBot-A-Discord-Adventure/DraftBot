import {WitchEvent} from "../WitchEvent";
import {generateRandomPotion} from "../../utils/ItemUtils";
import {Constants} from "../../Constants";
import {ItemConstants} from "../../constants/ItemConstants";
import Potion from "../../database/game/models/Potion";
import {SmallEventConstants} from "../../constants/SmallEventConstants";

export default class Rose extends WitchEvent {

	public constructor() {
		super("rose");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.setOutcomeProbabilities(20, 0, 10, 20);
	}

	/**
	 * The rose will give a health potion with an uncommon maximum rarity.
	 */
	async generatePotion(): Promise<Potion> {
		return await generateRandomPotion(
			Constants.ITEM_NATURE.HEALTH,
			ItemConstants.RARITY.UNCOMMON);
	}
}
