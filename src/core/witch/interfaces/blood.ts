import {WitchEvent} from "../WitchEvent";
import {generateRandomPotion} from "../../utils/ItemUtils";
import {Constants} from "../../Constants";
import {ItemConstants} from "../../constants/ItemConstants";
import Potion from "../../database/game/models/Potion";
import {SmallEventConstants} from "../../constants/SmallEventConstants";

export default class Blood extends WitchEvent {

	public constructor() {
		super("blood");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.setOutcomeProbabilities(25, 0, 0, 25);
	}

	/**
	 * The blood will give a health potion with a rare maximum rarity.
	 */
	async generatePotion(): Promise<Potion> {
		return await generateRandomPotion(
			Constants.ITEM_NATURE.HEALTH,
			ItemConstants.RARITY.RARE);
	}
}
