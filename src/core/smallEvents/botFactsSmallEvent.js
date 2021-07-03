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
	const translationIntroSE = JsonReader.smallEventsIntros.getTranslation(language);

	const base = JsonReader.smallEvents.botFacts.emote + " " + translationIntroSE.intro[randInt(0, translationIntroSE.intro.length)];

	const outReceived = draftbotRandom.pick(Object.keys(translationBF.possiblesInfos));

	// TODO : changer la string quand on aura passé Tools en Module
	const commandToEnter = "get" + outReceived.slice(0, 1).toUpperCase() + outReceived.slice(1) + "(entity, language)";
	const resultToPutInEmbed = await eval(commandToEnter);
	seEmbed.setDescription(base +
		format(
			translationBF.stories[draftbotRandom.pick(Object.keys(translationBF.stories))],
			{
				botFact: format(
					translationBF.possiblesInfos[outReceived],
					{
						infoNumber: resultToPutInEmbed[0],
						infoComplement: resultToPutInEmbed[1]
					}
				)
			})
	);
	await message.channel.send(seEmbed);
	log(entity.discordUserId + " got infos about people in the bot.");
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};