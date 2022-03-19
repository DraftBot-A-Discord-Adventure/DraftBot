import {SmallEvent} from "./SmallEvent";
import Entity from "../models/Entity";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";

export const smallEvent: SmallEvent = {
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	async executeSmallEvent(interaction: CommandInteraction, language: string, entity: Entity, seEmbed: DraftBotEmbed): Promise<void> {
		seEmbed.setDescription(seEmbed.description + Translations.getModule("smallEvents.doNothing", language).getRandom("stories"));
		await interaction.reply({ embeds: [seEmbed] });
		console.log(entity.discordUserId + " done nothing.");
	}
};