import {SmallEvent} from "./SmallEvent";
import Entity from "../models/Entity";
import {CommandInteraction, TextChannel} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {generateRandomItem, giveItemToPlayer} from "../utils/ItemUtils";
import {Constants} from "../Constants";

export const smallEvent: SmallEvent = {
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	async executeSmallEvent(interaction: CommandInteraction, language: string, entity: Entity, seEmbed: DraftBotEmbed): Promise<void> {
		const randomItem = await generateRandomItem(Constants.RARITY.EPIC);
		seEmbed.setDescription(
			seEmbed.description +
			Translations.getModule("smallEventsIntros", language).getRandom("intro") +
			Translations.getModule("smallEvents.findItem", language).getRandom("intrigue")
		);

		await interaction.reply({ embeds: [seEmbed] });
		console.log(entity.discordUserId + " got an item from a mini event ");
		await giveItemToPlayer(entity, randomItem, language, interaction.user, <TextChannel> interaction.channel);
	}
};