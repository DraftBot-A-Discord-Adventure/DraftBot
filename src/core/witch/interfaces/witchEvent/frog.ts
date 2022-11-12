import {WitchEvent} from "../../WitchEvent";
import {RandomUtils} from "../../../utils/RandomUtils";
import {Interaction} from "discord.js";
import Player from "../../../database/game/models/Player";
import {generateRandomPotion, giveItemToPlayer} from "../../../utils/ItemUtils";
import {Constants} from "../../../Constants";
import {InventorySlots} from "../../../database/game/models/InventorySlot";

export default class Frog extends WitchEvent {
	async givePotion(interaction: Interaction, player: Player, language: string): Promise<void> {
		const potionToGive = await generateRandomPotion(
			RandomUtils.draftbotRandom.bool() ? Constants.ITEM_NATURE.SPEED : Constants.ITEM_NATURE.TIME_SPEEDUP,
			Constants.RARITY.RARE);
		await giveItemToPlayer(
			player,
			potionToGive,
			language,
			interaction.user,
			interaction.channel,
			await InventorySlots.getOfPlayer(player.id)
		);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async giveEffect(player: Player): Promise<void> {
		return await Promise.resolve();
	}
}
