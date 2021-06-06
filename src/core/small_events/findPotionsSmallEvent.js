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
	const translationIntroSE = JsonReader.smallEventsIntros.getTranslation(language);
	const translationFP = JsonReader.small_events.findPotions.getTranslation(language);
	const randomItem = await entity.Player.Inventory.generateRandomItem(undefined,ITEMTYPE.POTION);
	seEmbed.setDescription(
		seEmbed.description +
		translationIntroSE.intro[randInt(0, translationIntroSE.intro.length)] +
		translationFP.intrigue[randInt(0, translationFP.intrigue.length)]
	);

	await message.channel.send(seEmbed);
	log(entity.discordUser_id + " got a potion from a mini event ");
	await giveItem(entity, randomItem, language, message.author, message.channel);
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};