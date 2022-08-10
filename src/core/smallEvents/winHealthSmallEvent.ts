import {SmallEvent} from "./SmallEvent";
import Entity from "../database/game/models/Entity";
import {CommandInteraction} from "discord.js";
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
		const healthWon = RandomUtils.draftbotRandom.integer(
			Constants.SMALL_EVENT.MINIMUM_HEALTH_WON,
			Constants.SMALL_EVENT.MAXIMUM_HEALTH_WON
		);
		const translationWH = Translations.getModule("smallEvents.winHealth", language);
		seEmbed.setDescription(
			Translations.getModule("smallEventsIntros", language).getRandom("intro") +
			format(translationWH.getRandom("intrigue"), {
				health: healthWon
			})
		);
		await entity.addHealth(healthWon, interaction.channel, language);
		await entity.save();
		await interaction.reply({embeds: [seEmbed]});
		console.log(entity.discordUserId + " gained some health points in a mini event");
	}
};