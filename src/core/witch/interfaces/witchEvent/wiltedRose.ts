import {WitchEvent} from "../../WitchEvent";
import {generateRandomPotion} from "../../../utils/ItemUtils";
import {Constants} from "../../../Constants";
import {ItemConstants} from "../../../constants/ItemConstants";
import Potion from "../../../database/game/models/Potion";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";

export default class WiltedRose extends WitchEvent {

	public constructor() {
		super("wiltedRose");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.setOutcomeProbabilities(20, 0, 10, 20);
	}

	/**
	 * The wilted rose will give a defense potion with an uncommon maximum rarity.
	 */
	async generatePotion(): Promise<Potion> {
		return await generateRandomPotion(
			Constants.ITEM_NATURE.DEFENSE,
			ItemConstants.RARITY.UNCOMMON);
	}
}
