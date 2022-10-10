import {SmallEvent} from "./SmallEvent";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {RandomUtils} from "../utils/RandomUtils";
import {format} from "../utils/StringFormatter";
import {Guilds} from "../database/game/models/Guild";
import {smallEvent as doNothing} from "./doNothingSmallEvent";
import {Constants} from "../Constants";
import Player from "../database/game/models/Player";

export const smallEvent: SmallEvent = {
	/**
	 * No restrictions on who can do it
	 */
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	/**
	 * Gives XP to the player's guild, or do the doNothing small event if you are not in a guild
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const g = await Guilds.getById(player.guildId);
		if (g === null || g.isAtMaxLevel()) {
			return await doNothing.executeSmallEvent(interaction, language, player, seEmbed);
		}
		const xpWon = RandomUtils.draftbotRandom.integer(
			Constants.SMALL_EVENT.MINIMUM_GUILD_EXPERIENCE_WON + g.level,
			Constants.SMALL_EVENT.MAXIMUM_GUILD_EXPERIENCE_WON + g.level * 2
		);

		const translationWGXP = Translations.getModule("smallEvents.winGuildXP", language);
		seEmbed.setDescription(
			seEmbed.data.description +
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

		await interaction.editReply({embeds: [seEmbed]});
	}
};