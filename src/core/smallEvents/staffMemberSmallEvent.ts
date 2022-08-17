import {SmallEvent} from "./SmallEvent";
import Entity from "../database/game/models/Entity";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {format} from "../utils/StringFormatter";
import {Translations} from "../Translations";
import {RandomUtils} from "../utils/RandomUtils";

export const smallEvent: SmallEvent = {
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	async executeSmallEvent(interaction: CommandInteraction, language: string, entity: Entity, seEmbed: DraftBotEmbed): Promise<void> {
		const tr = Translations.getModule("smallEvents.staffMember", language);
		const keys = tr.getKeys("members");
		const key = keys[RandomUtils.randInt(0, keys.length)];
		seEmbed.setDescription(
			seEmbed.description + " "
			+ format(tr.getRandom("context"), {
				pseudo: key,
				sentence: tr.get("members." + key)
			}));
		await interaction.reply({ embeds: [seEmbed] });
	}
};