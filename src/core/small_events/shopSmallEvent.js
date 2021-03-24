/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send. The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
const executeSmallEvent = async function (message, language, entity, seEmbed) {

	let RandomItem = await entity.Player.Inventory.generateRandomItem(5);
	let price = getItemValue(RandomItem);
	if (randInt(1, 10) === 10) {
		price *= 4;
	} else {
		price *= 0.6;
	}
	price = Math.round(price);
	message.channel.send();
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};