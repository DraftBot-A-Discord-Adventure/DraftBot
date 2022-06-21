import {SmallEvent} from "./SmallEvent";
import Entity from "../models/Entity";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {generateRandomItem, giveItemToPlayer} from "../utils/ItemUtils";
import {Constants} from "../Constants";

export const smallEvent: SmallEvent = {
	canBeExecuted(entity: Entity): Promise<boolean> {
		return Promise.resolve(entity.Player.hasEmptyMissionSlot());
	},

	async executeSmallEvent(interaction: CommandInteraction, language: string, entity: Entity, seEmbed: DraftBotEmbed): Promise<void> {
		const randomItem = await generateRandomItem(Constants.RARITY.MYTHICAL, Constants.ITEM_CATEGORIES.POTION);
		seEmbed.setDescription(
			seEmbed.description +
			Translations.getModule("smallEventsIntros", language).getRandom("intro") +
			Translations.getModule("smallEvents.findPotions", language).getRandom("intrigue")
		);

		await interaction.reply({embeds: [seEmbed]});
		console.log(entity.discordUserId + " got a potion from a mini event ");
		await giveItemToPlayer(entity, randomItem, language, interaction.user, interaction.channel);
	}
};