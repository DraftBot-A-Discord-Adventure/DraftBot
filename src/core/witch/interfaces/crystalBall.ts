import {WitchEvent} from "../WitchEvent";
import Player from "../../database/game/models/Player";
import {generateRandomPotion} from "../../utils/ItemUtils";
import {Constants} from "../../Constants";
import {TravelTime} from "../../maps/TravelTime";
import {EffectsConstants} from "../../constants/EffectsConstants";
import {NumberChangeReason} from "../../constants/LogsConstants";
import {ItemConstants} from "../../constants/ItemConstants";
import {SmallEventConstants} from "../../constants/SmallEventConstants";
import {GenericItemModel} from "../../database/game/models/GenericItemModel";

/**
 * The crystal ball can give a time potion or make the player scared
 */
export default class CrystalBall extends WitchEvent {

	public constructor() {
		super("crystalBall");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.ADVICE;
		this.effectName = "scared";
		this.setOutcomeProbabilities(25, 25, 0, 0);
	}

	/**
	 * The crystal ball will give a time skip potion with a rare maximum rarity.
	 */
	async generatePotion(): Promise<GenericItemModel> {
		return await generateRandomPotion(
			Constants.ITEM_NATURE.TIME_SPEEDUP,
			ItemConstants.RARITY.RARE,ItemConstants.RARITY.RARE
		);
	}

	/**
	 * The crystal ball can make the player scared.
	 * @param player
	 */
	async giveEffect(player: Player): Promise<void> {
		await TravelTime.applyEffect(
			player,
			EffectsConstants.EMOJI_TEXT.SCARED,
			this.timePenalty,
			new Date(),
			NumberChangeReason.SMALL_EVENT
		);
	}
}