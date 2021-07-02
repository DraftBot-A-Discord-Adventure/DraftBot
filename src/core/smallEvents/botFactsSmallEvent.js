/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send. The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
const executeSmallEvent = async function(message, language, entity, seEmbed) {
	const translationBF = JsonReader.smallEvents.botFacts.getTranslation(language);
	const outReceived = draftbotRandom.pick(Object.keys(translationBF.possiblesInfos));
	console.log(outReceived);
	log(entity.discordUserId + " got infos about people in the bot.");
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};