import {WitchEvent} from "../../WitchEvent";
import Player from "../../../database/game/models/Player";
import {generateRandomPotion, generateRandomRarity} from "../../../utils/ItemUtils";
import {Constants} from "../../../Constants";
import {TravelTime} from "../../../maps/TravelTime";
import {EffectsConstants} from "../../../constants/EffectsConstants";
import {NumberChangeReason} from "../../../constants/LogsConstants";
import {ItemConstants} from "../../../constants/ItemConstants";
import Potion from "../../../database/game/models/Potion";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";

export default class BigWarm extends WitchEvent {

	public constructor() {
		super("bigwarm");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.ADVICE;
		this.setOutcomeProbabilities(30, 0, 10, 10);
		this.forceEffect = true;
	}

	/**
	 * The big warm will give very powerful attack potion.
	 */
	async generatePotion(): Promise<Potion> {
		return await generateRandomPotion(
			Constants.ITEM_NATURE.ATTACK,
			generateRandomRarity(ItemConstants.RARITY.EPIC, ItemConstants.RARITY.MYTHICAL));
	}

	/**
	 * the big warm advice will make the player occupied for 30 minutes
	 * @param player
	 */
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