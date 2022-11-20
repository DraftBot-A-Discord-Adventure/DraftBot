import {WitchEvent} from "../WitchEvent";
import Player from "../../database/game/models/Player";
import {generateRandomPotion, generateRandomRarity} from "../../utils/ItemUtils";
import {TravelTime} from "../../maps/TravelTime";
import {EffectsConstants} from "../../constants/EffectsConstants";
import {NumberChangeReason} from "../../constants/LogsConstants";
import {ItemConstants} from "../../constants/ItemConstants";
import Potion from "../../database/game/models/Potion";
import {SmallEventConstants} from "../../constants/SmallEventConstants";

export default class Wand extends WitchEvent {

	public constructor() {
		super("wand");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.ADVICE;
		this.setOutcomeProbabilities(50, 0, 0, 0);
		this.forceEffect = true;
	}

	/**
	 * The wand will give a random potion with an epic maximum rarity and a rare minimum rarity.
	 */
	async generatePotion(): Promise<Potion> {
		return await generateRandomPotion(
			null,
			generateRandomRarity(ItemConstants.RARITY.RARE, ItemConstants.RARITY.EPIC)
		);
	}

	/**
	 * The wand will make the player occupied for 1 hour.
	 * @param player
	 */
	async giveEffect(player: Player): Promise<void> {
		await TravelTime.applyEffect(
			player,
			EffectsConstants.EMOJI_TEXT.OCCUPIED,
			60,
			new Date(),
			NumberChangeReason.SMALL_EVENT
		);
	}
}