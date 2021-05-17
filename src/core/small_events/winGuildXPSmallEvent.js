const doNothing = require('./doNothingSmallEvent');

/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send. The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
const executeSmallEvent = async function (message, language, entity, seEmbed) {

	let g = await Guilds.getById(entity.Player.guild_id);

	if (g === null) {
		return await doNothing.executeSmallEvent(message, language, entity, seEmbed);
	}

	let xpWon = draftbotRandom.integer(SMALL_EVENT.MINIMUM_GUILD_EXPERIENCE_WON + g.level, SMALL_EVENT.MAXIMUM_GUILD_EXPERIENCE_WON + g.level * 2);

	seEmbed.setDescription(format(JsonReader.small_events.winGuildXP.getTranslation(language).stories[randInt(0, JsonReader.small_events.winGuildXP.getTranslation(language).stories.length)] + JsonReader.small_events.winGuildXP.getTranslation(language).end, {
			guilde: g.name,
			xp: xpWon
		})
	);
	g.experience += xpWon;
	while (g.needLevelUp()) {
		await g.levelUpIfNeeded(message.channel, language);
	}
	await g.save();

	const msg = await message.channel.send(seEmbed);
	log(entity.discordUser_id + "'guild gained some xp points in a mini event");
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};