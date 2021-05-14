let Maps = require('../Maps');
/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send. The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
const executeSmallEvent = async function (message, language, entity, seEmbed) {
	let outRand = draftbotRandom.integer(0, 2);
	switch (outRand) {
		case 0:
			let lifeLoss = draftbotRandom.integer(SMALL_EVENT.MINIMUM_HEALTH_LOST_SMALL, SMALL_EVENT.MAXIMUM_HEALTH_LOST_SMALL);
			seEmbed.setDescription(format(JsonReader.small_events.smallBadEvent.getTranslation(language).lifeLoss.stories[randInt(0, JsonReader.small_events.smallBadEvent.getTranslation(language).lifeLoss.stories.length)], {lifeLoss: lifeLoss}));
			entity.Player.addHealth(-lifeLoss);
			break;
		case 1:
			let time = draftbotRandom.integer(SMALL_EVENT.MINIMUM_TIME_LOST_SMALL, SMALL_EVENT.MAXIMUM_TIME_LOST_SMALL) * 5;
			seEmbed.setDescription(format(JsonReader.small_events.smallBadEvent.getTranslation(language).alteration.stories[randInt(0, JsonReader.small_events.smallBadEvent.getTranslation(language).alteration.stories.length)], {alteTime: minutesToString(time)}));
			await Maps.applyEffect(entity.Player, EFFECT.OCCUPIED, time);
			break;
		default:
			let moneyLoss = draftbotRandom.integer(SMALL_EVENT.MINIMUM_MONEY_LOST_SMALL, SMALL_EVENT.MAXIMUM_MONEY_LOST_SMALL);
			seEmbed.setDescription(format(JsonReader.small_events.smallBadEvent.getTranslation(language).moneyLoss.stories[randInt(0, JsonReader.small_events.smallBadEvent.getTranslation(language).moneyLoss.stories.length)], {moneyLost: moneyLoss}));
			entity.Player.addMoney(-moneyLoss);
			break;
	}
	const msg = await message.channel.send(seEmbed);
	log(entity.discordUser_id + " got small bad event.");
	await entity.Player.save();
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};