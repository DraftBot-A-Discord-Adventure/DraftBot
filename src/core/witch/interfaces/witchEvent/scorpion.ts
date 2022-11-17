import {WitchEvent} from "../../WitchEvent";

import Player from "../../../database/game/models/Player";
import {generateRandomPotion} from "../../../utils/ItemUtils";
import {Constants} from "../../../Constants";
import {TravelTime} from "../../../maps/TravelTime";
import {EffectsConstants} from "../../../constants/EffectsConstants";
import {NumberChangeReason} from "../../../constants/LogsConstants";
import {ItemConstants} from "../../../constants/ItemConstants";
import Potion from "../../../database/game/models/Potion";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";

export default class Scorpion extends WitchEvent {

	public constructor() {
		super("scorpion");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.setOutcomeProbabilities(35, 5, 0, 10);
	}

	/**
	 * The scorpion will give an attack potion with a rare maximum rarity.
	 */
	async generatePotion(): Promise<Potion> {
		return await generateRandomPotion(
			Constants.ITEM_NATURE.ATTACK,
			ItemConstants.RARITY.RARE);
	}

	/**
	 * The scorpion can make the player sick.
	 * @param player
	 */
	async giveEffect(player: Player): Promise<void> {
		await TravelTime.applyEffect(
			player,
			EffectsConstants.EMOJI_TEXT.SICK,
			0,
			new Date(),
			NumberChangeReason.SMALL_EVENT,
			new Date()
		);
	}

}
