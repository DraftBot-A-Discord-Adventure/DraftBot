import {SmallEvent} from "./SmallEvent";
import Entity from "../models/Entity";
import {CommandInteraction, TextChannel} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {RandomUtils} from "../utils/RandomUtils";
import {format} from "../utils/StringFormatter";
import {Constants} from "../Constants";
import {Translations} from "../Translations";

export const smallEvent: SmallEvent = {
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	async executeSmallEvent(interaction: CommandInteraction, language: string, entity: Entity, seEmbed: DraftBotEmbed): Promise<void> {
		const xpWon = RandomUtils.draftbotRandom.integer(
			Constants.SMALL_EVENT.MINIMUM_EXPERIENCE_WON,
			Constants.SMALL_EVENT.MAXIMUM_EXPERIENCE_WON
		);
		const translationWXPP = Translations.getModule("smallEvents.winPersonalXP", language);
		seEmbed
			.setDescription(
				format(
					Translations.getModule("smallEventsIntros", language).getRandom("intro") +
					+ translationWXPP.get("end"),
					{
						xp: xpWon
					})
			);
		await entity.Player.addExperience(xpWon, entity, <TextChannel> interaction.channel, language);
		await entity.Player.save();
		await entity.save();
		await interaction.reply({ embeds: [seEmbed] });
		console.log(entity.discordUserId + " gained some xp points in a mini event");
	}
};