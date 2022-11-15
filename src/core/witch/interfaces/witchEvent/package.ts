import {WitchEvent} from "../../WitchEvent";
import {Interaction} from "discord.js";
import Player from "../../../database/game/models/Player";
import {generateRandomPotion, giveItemToPlayer} from "../../../utils/ItemUtils";
import {InventorySlots} from "../../../database/game/models/InventorySlot";
import {TravelTime} from "../../../maps/TravelTime";
import {EffectsConstants} from "../../../constants/EffectsConstants";
import {NumberChangeReason} from "../../../constants/LogsConstants";
import {ItemConstants} from "../../../constants/ItemConstants";

export default class Package extends WitchEvent {
	async givePotion(interaction: Interaction, player: Player, language: string): Promise<void> {
		const potionToGive = await generateRandomPotion(
			null,
			ItemConstants.RARITY.LEGENDARY);
		await giveItemToPlayer(
			player,
			potionToGive,
			language,
			interaction.user,
			interaction.channel,
			await InventorySlots.getOfPlayer(player.id)
		);
	}

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
