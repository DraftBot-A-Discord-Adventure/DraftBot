import {SmallEvent} from "./SmallEvent";
import Entity from "../database/game/models/Entity";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {format} from "../utils/StringFormatter";
import {Translations} from "../Translations";
import {RandomUtils} from "../utils/RandomUtils";

export const smallEvent: SmallEvent = {
	/**
	 * No restrictions on who can do it
	 */
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	/**
	 * Present in a fashion way one of the member of the Draftbot's staff
	 * @param interaction
	 * @param language
	 * @param entity
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, entity: Entity, seEmbed: DraftBotEmbed): Promise<void> {
		const tr = Translations.getModule("smallEvents.staffMember", language);
		const keys = tr.getKeys("members");
		const key = keys[RandomUtils.randInt(0, keys.length)];
		seEmbed.setDescription(
			`${seEmbed.data.description} ${format(tr.getRandom("context"), {
				pseudo: key,
				sentence: tr.get(`members.${key}`)
			})}`);
		await interaction.editReply({embeds: [seEmbed]});
	}
};