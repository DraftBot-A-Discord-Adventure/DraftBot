import {SmallEvent} from "./SmallEvent";
import Entity from "../database/game/models/Entity";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {Maps} from "../Maps";
import {RandomUtils} from "../utils/RandomUtils";
import {format} from "../utils/StringFormatter";
import {NumberChangeReason} from "../database/logs/LogsDatabase";

export const smallEvent: SmallEvent = {
	/**
	 * No restrictions on who can do it
	 */
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	/**
	 * Advance the time of the entity
	 * @param interaction
	 * @param language
	 * @param entity
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, entity: Entity, seEmbed: DraftBotEmbed): Promise<void> {
		const timeAdvanced = RandomUtils.draftbotRandom.integer(10, 50);

		await Maps.advanceTime(entity.Player, timeAdvanced, NumberChangeReason.SMALL_EVENT);
		await entity.Player.save();

		seEmbed.setDescription(
			seEmbed.data.description +
			Translations.getModule("smallEventsIntros", language).getRandom("intro") +
			format(Translations.getModule("smallEvents.advanceTime", language).getRandom("stories"), {
				time: timeAdvanced
			})
		);

		await interaction.editReply({embeds: [seEmbed]});
	}
};