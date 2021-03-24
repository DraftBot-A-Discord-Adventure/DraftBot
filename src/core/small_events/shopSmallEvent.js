/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send. The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
const executeSmallEvent = async function (message, language, entity, seEmbed) {

	let randomItem = await entity.Player.Inventory.generateRandomItem(5);
	let price = getItemValue(randomItem);
	if (randInt(1, 10) === 10) {
		price *= 4;
	} else {
		price *= 0.6;
	}
	price = Math.round(price);
	let gender = randInt(0, 1);
	seEmbed.setDescription(seEmbed.description + format(JsonReader.small_events.shop.getTranslation(language).intro[gender][randInt(0, JsonReader.small_events.shop.getTranslation(language).intro[gender].length)] + JsonReader.small_events.shop.getTranslation(language).end, {
		name: JsonReader.small_events.shop.getTranslation(language).names[gender][randInt(0, JsonReader.small_events.shop.getTranslation(language).names[gender].length)],
		item: randomItem.toString(language),
		price: price
	}));
	const msg = message.channel.send(seEmbed);
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};