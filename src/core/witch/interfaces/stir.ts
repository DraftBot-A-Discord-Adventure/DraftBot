import {WitchEvent} from "../WitchEvent";
import Player from "../../database/game/models/Player";
import {generateRandomPotion} from "../../utils/ItemUtils";
import {TravelTime} from "../../maps/TravelTime";
import {EffectsConstants} from "../../constants/EffectsConstants";
import {NumberChangeReason} from "../../constants/LogsConstants";
import {ItemConstants} from "../../constants/ItemConstants";
import {SmallEventConstants} from "../../constants/SmallEventConstants";
import {GenericItemModel} from "../../database/game/models/GenericItemModel";

/**
 * The stir will very rarely give a random potion
 */
export default class Stir extends WitchEvent {

	public constructor() {
		super("stir");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.ADVICE;
		this.setOutcomeProbabilities(10, 0, 0, 40);
		this.forceEffect = true;
		this.timePenalty = 5;
	}

	/**
	 * The stir will give a random potion with a rare maximum rarity.
	 */
	static async generatePotion(): Promise<GenericItemModel> {
		return await generateRandomPotion(
			null,
			ItemConstants.RARITY.RARE);
	}

	/**
	 * The stir will make the player occupied for 5 minutes.
	 * @param player
	 */
	async giveEffect(player: Player): Promise<void> {
		await TravelTime.applyEffect(
			player,
			EffectsConstants.EMOJI_TEXT.OCCUPIED,
			this.timePenalty,
			new Date(),
			NumberChangeReason.SMALL_EVENT
		);
	}
}