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

	const healthWon = draftbotRandom.integer(
		SMALL_EVENT.MINIMUM_HEALTH_WON,
		SMALL_EVENT.MAXIMUM_HEALTH_WON
	);
	const translationWH = JsonReader.smallEvents.winHealth.getTranslation(language);
	const translationIntrosSE = JsonReader.smallEventsIntros.getTranslation(language);
	seEmbed.setDescription(
		translationIntrosSE.intro[randInt(0, translationIntrosSE.intro.length)] +
		format(translationWH.intrigue[randInt(0, translationWH.intrigue.length)], {
			health: healthWon
		})
	);
	await entity.addHealth(healthWon, message.channel, language);
	await entity.save();
	await message.channel.send({ embeds: [seEmbed] });
	log(entity.discordUserId + " gained some health points in a mini event");
};

module.exports = {
	smallEvent: {
		executeSmallEvent: executeSmallEvent,
		canBeExecuted: () => Promise.resolve(true)
	}
};