import {SmallEvent} from "./SmallEvent";
import Entity from "../models/Entity";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {RandomUtils} from "../utils/RandomUtils";
import {format} from "../utils/StringFormatter";
import {Guilds} from "../models/Guild";
import {smallEvent as doNothing} from "./doNothingSmallEvent";
import {Constants} from "../Constants";

export const smallEvent: SmallEvent = {
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	async executeSmallEvent(interaction: CommandInteraction, language: string, entity: Entity, seEmbed: DraftBotEmbed): Promise<void> {
		const g = await Guilds.getById(entity.Player.guildId);
		if (g === null || g.isAtMaxLevel()) {
			return await doNothing.executeSmallEvent(interaction, language, entity, seEmbed);
		}
		const xpWon = RandomUtils.draftbotRandom.integer(
			Constants.SMALL_EVENT.MINIMUM_GUILD_EXPERIENCE_WON + g.level,
			Constants.SMALL_EVENT.MAXIMUM_GUILD_EXPERIENCE_WON + g.level * 2
		);

		const translationWGXP = Translations.getModule("smallEvents.winGuildXP", language);
		seEmbed.setDescription(
			seEmbed.description +
			format(
				translationWGXP.getRandom("stories")
				+ translationWGXP.get("end"), {
					guilde: g.name,
					xp: xpWon
				}
			)
		);
		g.experience += xpWon;
		while (g.needLevelUp()) {
			await g.levelUpIfNeeded(interaction.channel, language);
		}
		await g.save();

		await interaction.reply({embeds: [seEmbed]});
		console.log(entity.discordUserId + "'guild gained some xp points in a mini event");
	}
};