import {WitchEvent} from "../../WitchEvent";
import Player from "../../../database/game/models/Player";
import {generateRandomPotion, generateRandomRarity} from "../../../utils/ItemUtils";
import {TravelTime} from "../../../maps/TravelTime";
import {EffectsConstants} from "../../../constants/EffectsConstants";
import {NumberChangeReason} from "../../../constants/LogsConstants";
import {ItemConstants} from "../../../constants/ItemConstants";
import Potion from "../../../database/game/models/Potion";

export default class Wand extends WitchEvent {

	async generatePotion(): Promise<Potion> {
		return await generateRandomPotion(
			null,
			generateRandomRarity(ItemConstants.RARITY.RARE, ItemConstants.RARITY.EPIC)
		);
	}

	async giveEffect(player: Player): Promise<void> {
		await TravelTime.applyEffect(
			player,
			EffectsConstants.EMOJI_TEXT.OCCUPIED,
			60,
			new Date(),
			NumberChangeReason.SMALL_EVENT,
			new Date()
		);
	}
}