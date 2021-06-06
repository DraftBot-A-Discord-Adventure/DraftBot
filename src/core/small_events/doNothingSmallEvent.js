/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send. The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
const executeSmallEvent = async function (message, language, entity, seEmbed) {
	seEmbed.setDescription(JsonReader.small_events.doNothing.emote + JsonReader.small_events.doNothing.getTranslation(language).stories[randInt(0, JsonReader.small_events.doNothing.getTranslation(language).stories.length)]);
	await message.channel.send(seEmbed);
	log(entity.discordUser_id + " done nothing.");
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};