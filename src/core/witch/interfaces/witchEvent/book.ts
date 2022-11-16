import {WitchEvent} from "../../WitchEvent";
import Player from "../../../database/game/models/Player";
import {generateRandomPotion} from "../../../utils/ItemUtils";
import {TravelTime} from "../../../maps/TravelTime";
import {EffectsConstants} from "../../../constants/EffectsConstants";
import {NumberChangeReason} from "../../../constants/LogsConstants";
import {ItemConstants} from "../../../constants/ItemConstants";
import Potion from "../../../database/game/models/Potion";

export default class Book extends WitchEvent {
	async generatePotion(): Promise<Potion> {
		return await generateRandomPotion(
			null,
			ItemConstants.RARITY.SPECIAL
		);
	}

	async giveEffect(player: Player): Promise<void> {
		await TravelTime.applyEffect(
			player,
			EffectsConstants.EMOJI_TEXT.OCCUPIED,
			30,
			new Date(),
			NumberChangeReason.SMALL_EVENT,
			new Date()
		);
	}
}