import {SmallEvent} from "./SmallEvent";
import Entity from "../database/game/models/Entity";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {generateRandomItem, giveItemToPlayer} from "../utils/ItemUtils";
import {Constants} from "../Constants";

export const smallEvent: SmallEvent = {
	/**
	 * No restrictions on who can do it
	 */
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	/**
	 * Find a random item that have a rarity of epic or less
	 * @param interaction
	 * @param language
	 * @param entity
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, entity: Entity, seEmbed: DraftBotEmbed): Promise<void> {
		const randomItem = await generateRandomItem(Constants.RARITY.EPIC);
		seEmbed.setDescription(
			seEmbed.data.description +
			Translations.getModule("smallEventsIntros", language).getRandom("intro") +
			Translations.getModule("smallEvents.findItem", language).getRandom("intrigue")
		);

		await interaction.reply({embeds: [seEmbed]});
		await giveItemToPlayer(entity, randomItem, language, interaction.user, interaction.channel);
	}
};