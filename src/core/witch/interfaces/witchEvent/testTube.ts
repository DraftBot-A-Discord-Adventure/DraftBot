import {WitchEvent} from "../../WitchEvent";
import {generateRandomPotion} from "../../../utils/ItemUtils";
import {ItemConstants} from "../../../constants/ItemConstants";
import Potion from "../../../database/game/models/Potion";

export default class TestTube extends WitchEvent {
	async generatePotion(): Promise<Potion> {
		return await generateRandomPotion(
			null,
			ItemConstants.RARITY.SPECIAL);
	}

	giveEffect(): null {
		return null;
	}
}
