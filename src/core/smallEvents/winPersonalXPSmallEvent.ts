import {SmallEvent} from "./SmallEvent";
import Entity from "../database/game/models/Entity";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {RandomUtils} from "../utils/RandomUtils";
import {format} from "../utils/StringFormatter";
import {Constants} from "../Constants";
import {Translations} from "../Translations";
import {NumberChangeReason} from "../database/logs/LogsDatabase";

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
					translationWXPP.getRandom("stories") + translationWXPP.get("end"),
					{
						xp: xpWon
					})
			);
		await entity.Player.addExperience(xpWon, entity, interaction.channel, language, NumberChangeReason.SMALL_EVENT);
		await entity.Player.save();
		await entity.save();
		await interaction.reply({embeds: [seEmbed]});
	}
};