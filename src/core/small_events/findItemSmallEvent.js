/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send. The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
const executeSmallEvent = async function(message, language, entity, seEmbed) {

	const randomItem = await entity.Player.Inventory.generateRandomItem(RARITY.EPIC);
	seEmbed.setDescription(
		seEmbed.description +
		JsonReader.smallEventsIntros.getTranslation(language).intro[randInt(0, JsonReader.smallEventsIntros.getTranslation(language).intro.length)] +
		JsonReader.small_events.findItem.getTranslation(language).intrigue[randInt(0, JsonReader.small_events.findItem.getTranslation(language).intrigue.length)]
	);

	await message.channel.send(seEmbed);
	log(entity.discordUser_id + " got an item from a mini event ");
	await giveItem(entity, randomItem, language, message.author, message.channel);
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};