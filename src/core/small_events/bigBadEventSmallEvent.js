const Maps = require("../Maps");
/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send. The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
const executeSmallEvent = async function(message, language, entity, seEmbed) {
	const outRand = draftbotRandom.integer(0, 2);
	const base = JsonReader.small_events.bigBadEvent.emote + " " + JsonReader.smallEventsIntros.getTranslation(language).intro[randInt(0, JsonReader.smallEventsIntros.getTranslation(language).intro.length)];
	let lifeLoss, seFallen, moneyLoss;
	switch (outRand) {
	case 0:
		lifeLoss = draftbotRandom.integer(SMALL_EVENT.MINIMUM_HEALTH_LOST_BIG, SMALL_EVENT.MAXIMUM_HEALTH_LOST_BIG);
		seEmbed.setDescription(base + format(JsonReader.small_events.bigBadEvent.getTranslation(language).lifeLoss.stories[randInt(0, JsonReader.small_events.bigBadEvent.getTranslation(language).lifeLoss.stories.length)], {lifeLoss: lifeLoss}));
		await entity.addHealth(-lifeLoss);
		break;
	case 1:
		seFallen = JsonReader.small_events.bigBadEvent.getTranslation(language).alteration.stories[randInt(0, JsonReader.small_events.bigBadEvent.getTranslation(language).alteration.stories.length)];
		seEmbed.setDescription(base + format(seFallen.sentence, {alteTime: minutesToString(millisecondsToMinutes(JsonReader.models.players.effectMalus[seFallen.alte])), alteEmoji: seFallen.alte}));
		await Maps.applyEffect(entity.Player, seFallen.alte);
		break;
	default:
		moneyLoss = draftbotRandom.integer(SMALL_EVENT.MINIMUM_MONEY_LOST_BIG, SMALL_EVENT.MAXIMUM_MONEY_LOST_BIG);
		seEmbed.setDescription(base + format(JsonReader.small_events.bigBadEvent.getTranslation(language).moneyLoss.stories[randInt(0, JsonReader.small_events.bigBadEvent.getTranslation(language).moneyLoss.stories.length)], {moneyLost: moneyLoss}));
		entity.Player.addMoney(-moneyLoss);
		break;
	}
	await message.channel.send(seEmbed);
	log(entity.discordUser_id + " got big bad event.");
	await entity.Player.killIfNeeded(entity, message.channel, language);
	await entity.Player.save();
	await entity.save();
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};