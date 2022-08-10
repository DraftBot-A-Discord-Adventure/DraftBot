import {SmallEvent} from "./SmallEvent";
import Entity from "../database/game/models/Entity";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {Data} from "../Data";

export const smallEvent: SmallEvent = {
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	async executeSmallEvent(interaction: CommandInteraction, language: string, entity: Entity, seEmbed: DraftBotEmbed): Promise<void> {
		seEmbed.setDescription(
			Data.getModule("smallEvents.doNothing").getString("emote") +
			Translations.getModule("smallEvents.doNothing", language).getRandom("stories"));
		await interaction.reply({embeds: [seEmbed]});
		console.log(entity.discordUserId + " done nothing.");
	}
};