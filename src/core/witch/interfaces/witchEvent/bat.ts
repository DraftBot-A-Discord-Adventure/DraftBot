import {WitchEvent} from "../../WitchEvent";
import {RandomUtils} from "../../../utils/RandomUtils";
import {Interaction} from "discord.js";
import Player from "../../../database/game/models/Player";
import {generateRandomPotion} from "../../../utils/ItemUtils";
import {Constants} from "../../../Constants";

export default class Bat extends WitchEvent {
	async givePotion(interaction: Interaction, player: Player, language: string): Promise<void> {
		await player.giveItem(await generateRandomPotion(
			RandomUtils.draftbotRandom.bool(0.625) ? Constants.ITEM_NATURE.SPEED : Constants.ITEM_NATURE.TIME_SPEEDUP,
			Constants.RARITY.SPECIAL));
	}

	async giveEffect(interaction: Interaction, player: Player, language: string): Promise<void>{
		return await Promise.resolve();
	}
}
