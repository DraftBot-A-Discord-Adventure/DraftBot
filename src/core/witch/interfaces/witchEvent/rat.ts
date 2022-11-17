import {WitchEvent} from "../../WitchEvent";
import {generateRandomPotion} from "../../../utils/ItemUtils";
import {Constants} from "../../../Constants";
import {ItemConstants} from "../../../constants/ItemConstants";
import Potion from "../../../database/game/models/Potion";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";

export default class Rat extends WitchEvent {

	public constructor() {
		super("rat");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.setOutcomeProbabilities(20, 0, 15, 15);
	}

	/**
	 * The rat will give an attack potion with a common maximum rarity.
	 */
	async generatePotion(): Promise<Potion> {
		return await generateRandomPotion(
			Constants.ITEM_NATURE.ATTACK,
			ItemConstants.RARITY.COMMON);
	}
}
