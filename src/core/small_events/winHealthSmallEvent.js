/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send. The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
const executeSmallEvent = async function (message, language, entity, seEmbed) {

	let healthwon = draftbotRandom.integer(SMALL_EVENT.MINIMUM_HEALTH_WON, SMALL_EVENT.MAXIMUM_HEALTH_WON);
	seEmbed.setDescription(
		JsonReader.smallEventsIntros.getTranslation(language).intro[randInt(0, JsonReader.smallEventsIntros.getTranslation(language).intro.length)] +
		format(JsonReader.small_events.winHealth.getTranslation(language).intrigue[randInt(0, JsonReader.small_events.winHealth.getTranslation(language).intrigue.length)], {
			health: healthwon
		})
	);

	const msg = await message.channel.send(seEmbed);
	log(entity.discordUser_id + " gained some health points in a mini event");
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};