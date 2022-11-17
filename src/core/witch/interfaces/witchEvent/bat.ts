import {WitchEvent} from "../../WitchEvent";
import {RandomUtils} from "../../../utils/RandomUtils";
import {generateRandomPotion} from "../../../utils/ItemUtils";
import {Constants} from "../../../Constants";
import {ItemConstants} from "../../../constants/ItemConstants";
import Potion from "../../../database/game/models/Potion";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";

export default class Bat extends WitchEvent {

	public constructor() {
		super("bat");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.setOutcomeProbabilities(40, 0, 0, 10);
	}

	/**
	 * The bat will give either a speed potion or a time potion with a special maximum rarity.
	 */
	async generatePotion(): Promise<Potion> {
		return await generateRandomPotion(
			RandomUtils.draftbotRandom.bool(0.625) ? Constants.ITEM_NATURE.SPEED : Constants.ITEM_NATURE.TIME_SPEEDUP,
			ItemConstants.RARITY.SPECIAL);
	}
}
