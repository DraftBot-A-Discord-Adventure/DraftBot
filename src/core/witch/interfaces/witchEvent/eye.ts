import {WitchEvent} from "../../WitchEvent";
import {generateRandomPotion} from "../../../utils/ItemUtils";
import {Constants} from "../../../Constants";
import {ItemConstants} from "../../../constants/ItemConstants";
import Potion from "../../../database/game/models/Potion";

export default class Eye extends WitchEvent {
	async generatePotion(): Promise<Potion> {
		return await generateRandomPotion(
			Constants.ITEM_NATURE.TIME_SPEEDUP,
			ItemConstants.RARITY.EPIC);
	}

	giveEffect(): null {
		return null;
	}
}
