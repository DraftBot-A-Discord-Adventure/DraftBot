import {WitchEvent} from "../../WitchEvent";
import {Interaction} from "discord.js";
import Player from "../../../database/game/models/Player";
import {generateRandomPotion, generateRandomRarity, giveItemToPlayer} from "../../../utils/ItemUtils";
import {Constants} from "../../../Constants";
import {InventorySlots} from "../../../database/game/models/InventorySlot";
import {TravelTime} from "../../../maps/TravelTime";
import {EffectsConstants} from "../../../constants/EffectsConstants";
import {NumberChangeReason} from "../../../constants/LogsConstants";

export default class BigWarm extends WitchEvent {
	async givePotion(interaction: Interaction, player: Player, language: string): Promise<void> {
		const potionToGive = await generateRandomPotion(
			Constants.ITEM_NATURE.ATTACK,
			generateRandomRarity(Constants.RARITY.EPIC, Constants.RARITY.MYTHICAL));
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
			EffectsConstants.EMOJI_TEXT.OCCUPIED,
			30,
			new Date(),
			NumberChangeReason.SMALL_EVENT,
			new Date()
		);
	}
}