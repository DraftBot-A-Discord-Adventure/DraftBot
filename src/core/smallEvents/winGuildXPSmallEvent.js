import {Guilds} from "../models/Guild";
import {smallEvent as doNothing} from "./doNothingSmallEvent";

/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send.
 *    The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
const executeSmallEvent = async function(message, language, entity, seEmbed) {

	const g = await Guilds.getById(entity.Player.guildId);
	if (g === null || g.isAtMaxLevel()) {
		return await doNothing.executeSmallEvent(message, language, entity, seEmbed);
	}
	const xpWon = draftbotRandom.integer(
		SMALL_EVENT.MINIMUM_GUILD_EXPERIENCE_WON + g.level,
		SMALL_EVENT.MAXIMUM_GUILD_EXPERIENCE_WON + g.level * 2
	);

	const translationWGXP = JsonReader.smallEvents.winGuildXP.getTranslation(language);
	seEmbed.setDescription(
		format(
			translationWGXP.stories[randInt(0, translationWGXP.stories.length)]
			+ translationWGXP.end, {
				guilde: g.name,
				xp: xpWon
			}
		)
	);
	g.experience += xpWon;
	while (g.needLevelUp()) {
		await g.levelUpIfNeeded(message.channel, language);
	}
	await g.save();

	await message.channel.send({ embeds: [seEmbed] });
	log(entity.discordUserId + "'guild gained some xp points in a mini event");
};

module.exports = {
	smallEvent: {
		executeSmallEvent: executeSmallEvent,
		canBeExecuted: () => Promise.resolve(true)
	}
};