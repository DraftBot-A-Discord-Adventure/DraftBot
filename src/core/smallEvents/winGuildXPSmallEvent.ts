import {SmallEvent} from "./SmallEvent";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {RandomUtils} from "../utils/RandomUtils";
import {format} from "../utils/StringFormatter";
import {Guilds} from "../database/game/models/Guild";
import {smallEvent as doNothing} from "./doNothingSmallEvent";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import Player from "../database/game/models/Player";
import {Maps} from "../maps/Maps";

export const smallEvent: SmallEvent = {
	/**
	 * Check if small event can be executed
	 */
	canBeExecuted(player: Player): Promise<boolean> {
		return Promise.resolve(Maps.isOnContinent(player));
	},

	/**
	 * Gives XP to the player's guild, or do the doNothing small event if you are not in a guild
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const guild = await Guilds.getById(player.guildId);
		if (guild === null || guild.isAtMaxLevel()) {
			return await doNothing.executeSmallEvent(interaction, language, player, seEmbed);
		}
		const xpWon = RandomUtils.draftbotRandom.integer(
			SmallEventConstants.GUILD_EXPERIENCE.MIN + guild.level,
			SmallEventConstants.GUILD_EXPERIENCE.MAX + guild.level * 2
		);

		const translationWGXP = Translations.getModule("smallEvents.winGuildXP", language);
		seEmbed.setDescription(
			seEmbed.data.description +
			format(
				translationWGXP.getRandom("stories")
				+ translationWGXP.get("end"), {
					guilde: guild.name,
					xp: xpWon
				}
			)
		);
		guild.experience += xpWon;
		while (guild.needLevelUp()) {
			await guild.levelUpIfNeeded(interaction.channel, language);
		}
		await guild.save();

		await interaction.editReply({embeds: [seEmbed]});
	}
};