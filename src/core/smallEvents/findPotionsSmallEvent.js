/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send.
 *    The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
import {generateRandomItem, giveItemToPlayer} from "../utils/ItemUtils";
import {Constants} from "../Constants";

const executeSmallEvent = async function(message, language, entity, seEmbed) {
	const translationIntroSE = JsonReader.smallEventsIntros.getTranslation(language);
	const translationFP = JsonReader.smallEvents.findPotions.getTranslation(language);
	const randomItem = await generateRandomItem(Constants.RARITY.MYTHICAL, Constants.ITEM_CATEGORIES.POTION);
	seEmbed.setDescription(
		seEmbed.description +
		translationIntroSE.intro[randInt(0, translationIntroSE.intro.length)] +
		translationFP.intrigue[randInt(0, translationFP.intrigue.length)]
	);

	await message.channel.send({ embeds: [seEmbed] });
	log(entity.discordUserId + " got a potion from a mini event ");
	await giveItemToPlayer(entity, randomItem, language, message.author, message.channel);
};

module.exports = {
	smallEvent: {
		executeSmallEvent: executeSmallEvent,
		canBeExecuted: () => Promise.resolve(true)
	}
};