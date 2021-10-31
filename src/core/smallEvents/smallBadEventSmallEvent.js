import {Maps} from "../Maps";
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
	const outRand = draftbotRandom.integer(0, 2);
	const translationIntrosSE = JsonReader.smallEventsIntros.getTranslation(language);
	const translationSBE = JsonReader.smallEvents.smallBadEvent.getTranslation(language);
	const base =
		JsonReader.smallEvents.smallBadEvent.emote + " "
		+ translationIntrosSE.intro[randInt(0, translationIntrosSE.intro.length)];
	let lifeLoss, time, moneyLoss;
	switch (outRand) {
	case 0:
		lifeLoss = draftbotRandom.integer(SMALL_EVENT.MINIMUM_HEALTH_LOST_SMALL,
			SMALL_EVENT.MAXIMUM_HEALTH_LOST_SMALL);
		seEmbed.setDescription(
			base
			+ format(
				translationSBE.lifeLoss.stories[randInt(0, translationSBE.lifeLoss.stories.length)
				], {lifeLoss: lifeLoss}
			)
		);
		await entity.addHealth(-lifeLoss);
		break;
	case 1:
		time = draftbotRandom.integer(SMALL_EVENT.MINIMUM_TIME_LOST_SMALL,
			SMALL_EVENT.MAXIMUM_TIME_LOST_SMALL) * 5;
		seEmbed.setDescription(
			base +
			format(
				translationSBE.alteration.stories[
					randInt(0, translationSBE.alteration.stories.length)
				], {alteTime: minutesToString(time)}));
		await Maps.applyEffect(entity.Player, EFFECT.OCCUPIED, time);
		break;
	default:
		moneyLoss = draftbotRandom.integer(SMALL_EVENT.MINIMUM_MONEY_LOST_SMALL,
			SMALL_EVENT.MAXIMUM_MONEY_LOST_SMALL);
		seEmbed.setDescription(
			base +
			format(
				translationSBE.moneyLoss.stories[
					randInt(0, translationSBE.moneyLoss.stories.length)
				], {moneyLost: moneyLoss}));
		entity.Player.addMoney(-moneyLoss);
		break;
	}
	await message.channel.send({ embeds: [seEmbed] });
	log(entity.discordUserId + " got small bad event.");
	await entity.Player.killIfNeeded(entity, message.channel, language);
	await entity.Player.save();
	await entity.save();
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};