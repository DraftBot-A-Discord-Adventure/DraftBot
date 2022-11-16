import {WitchEvent} from "../../WitchEvent";
import {RandomUtils} from "../../../utils/RandomUtils";
import {generateRandomPotion} from "../../../utils/ItemUtils";
import {Constants} from "../../../Constants";
import {ItemConstants} from "../../../constants/ItemConstants";
import Potion from "../../../database/game/models/Potion";

export default class Frog extends WitchEvent {
	async generatePotion(): Promise<Potion> {
		return await generateRandomPotion(
			RandomUtils.draftbotRandom.bool() ? Constants.ITEM_NATURE.SPEED : Constants.ITEM_NATURE.TIME_SPEEDUP,
			ItemConstants.RARITY.RARE);
	}
}
