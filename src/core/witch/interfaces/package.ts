import {WitchEvent} from "../WitchEvent";
import Player from "../../database/game/models/Player";
import {generateRandomPotion} from "../../utils/ItemUtils";
import {TravelTime} from "../../maps/TravelTime";
import {EffectsConstants} from "../../constants/EffectsConstants";
import {NumberChangeReason} from "../../constants/LogsConstants";
import {ItemConstants} from "../../constants/ItemConstants";
import {SmallEventConstants} from "../../constants/SmallEventConstants";
import {GenericItemModel} from "../../database/game/models/GenericItemModel";

export default class Package extends WitchEvent {

	public constructor() {
		super("package");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.setOutcomeProbabilities(45, 5, 0, 0);
	}

	/**
	 * The package will give a random potion with a legendary maximum rarity.
	 */
	async generatePotion(): Promise<GenericItemModel> {
		return await generateRandomPotion(
			null,
			ItemConstants.RARITY.LEGENDARY);
	}

	/**
	 * The package can make the player sick
	 * @param player
	 */
	async giveEffect(player: Player): Promise<void> {
		await TravelTime.applyEffect(
			player,
			EffectsConstants.EMOJI_TEXT.SICK,
			0,
			new Date(),
			NumberChangeReason.SMALL_EVENT
		);
	}
}
