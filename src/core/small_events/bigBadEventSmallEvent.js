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
			let lifeLoss = draftbotRandom.integer(SMALL_EVENT.MINIMUM_HEALTH_LOST_BIG, SMALL_EVENT.MAXIMUM_HEALTH_LOST_BIG);
			seEmbed.setDescription(format(JsonReader.small_events.bigBadEvent.getTranslation(language).lifeLoss.stories[randInt(0, JsonReader.small_events.bigBadEvent.getTranslation(language).lifeLoss.stories.length)], {lifeLoss: lifeLoss}));
			entity.Player.addHealth(-lifeLoss);
			break;
		case 1:
			let effect = draftbotRandom.pick([EFFECT.SLEEPING,EFFECT.DRUNK,EFFECT.FROZEN,EFFECT.HURT,EFFECT.SICK,EFFECT.INJURED,EFFECT.STARVING,EFFECT.CONFOUNDED]);
			let time = millisecondsToMinutes(JsonReader.models.players.effectMalus[effect]);
			seEmbed.setDescription(format(JsonReader.small_events.bigBadEvent.getTranslation(language).alteration.stories[randInt(0, JsonReader.small_events.bigBadEvent.getTranslation(language).alteration.stories.length)], {alteTime: minutesToString(time), alteEmoji: effect}));
			await Maps.applyEffect(entity.Player, effect);
			break;
		default:
			let moneyLoss = draftbotRandom.integer(SMALL_EVENT.MINIMUM_MONEY_LOST_BIG, SMALL_EVENT.MAXIMUM_MONEY_LOST_BIG);
			seEmbed.setDescription(format(JsonReader.small_events.smallBadEvent.getTranslation(language).moneyLoss.stories[randInt(0, JsonReader.small_events.smallBadEvent.getTranslation(language).moneyLoss.stories.length)], {moneyLost: moneyLoss}));
			entity.Player.addMoney(-moneyLoss);
			break;
	}
	const msg = await message.channel.send(seEmbed);
	log(entity.discordUser_id + " got big bad event.");
	await entity.Player.save();
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};