/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entity} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send.
 *    The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
const executeSmallEvent = async function(message, language, entity, seEmbed) {

	const xpWon = draftbotRandom.integer(
		SMALL_EVENT.MINIMUM_EXPERIENCE_WON,
		SMALL_EVENT.MAXIMUM_EXPERIENCE_WON
	);
	const translationWXPP = JsonReader.smallEvents.winPersonalXP.getTranslation(language);
	seEmbed
		.setDescription(
			format(
				translationWXPP.stories[randInt(0, translationWXPP.stories.length)]
				+ translationWXPP.end,
				{
					xp: xpWon
				})
		);
	await entity.Player.addExperience(xpWon, entity, message, language);
	await entity.Player.save();
	await entity.save();
	await message.channel.send({ embeds: [seEmbed] });
	log(entity.discordUserId + " gained some xp points in a mini event");
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};