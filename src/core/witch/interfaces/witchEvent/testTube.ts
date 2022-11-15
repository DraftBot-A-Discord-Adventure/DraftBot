import {WitchEvent} from "../../WitchEvent";
import {Interaction} from "discord.js";
import Player from "../../../database/game/models/Player";
import {generateRandomPotion, giveItemToPlayer} from "../../../utils/ItemUtils";
import {InventorySlots} from "../../../database/game/models/InventorySlot";
import {ItemConstants} from "../../../constants/ItemConstants";

export default class TestTube extends WitchEvent {
	async givePotion(interaction: Interaction, player: Player, language: string): Promise<void> {
		const potionToGive = await generateRandomPotion(
			null,
			ItemConstants.RARITY.SPECIAL);
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
