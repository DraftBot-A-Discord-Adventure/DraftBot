import {WitchEvent} from "../../WitchEvent";
import {generateRandomPotion} from "../../../utils/ItemUtils";
import {Constants} from "../../../Constants";
import {ItemConstants} from "../../../constants/ItemConstants";
import Potion from "../../../database/game/models/Potion";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";

export default class RedApple extends WitchEvent {

	public constructor() {
		super("redApple");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.setOutcomeProbabilities(10, 0, 0, 40);
	}

	/**
	 * The red apple will give a health potion with a common maximum rarity.
	 */
	async generatePotion(): Promise<Potion> {
		return await generateRandomPotion(
			Constants.ITEM_NATURE.HEALTH,
			ItemConstants.RARITY.COMMON);
	}
}
