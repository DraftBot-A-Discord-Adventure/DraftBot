const doNothing = require('doNothingSmallEvent');
const DBL = require('../DBL');
/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send. The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
const executeSmallEvent = async function (message, language, entity, seEmbed) {
	if (await DBL.getTimeBeforeDBLRoleRemove(entity.discordUser_id) < 0) {
		await doNothing.executeSmallEvent(message, language, entity, seEmbed);
	}
	if (randInt(0, 1)) {
		//object win
		seEmbed.setDescription(JsonReader.small_events.botVote.getTranslation(language).stories.itemWin[randInt(0, JsonReader.small_events.botVote.getTranslation(language).stories.itemWin.length)]);
		const msg = await message.channel.send(seEmbed);
		log(entity.discordUser_id + " won an object because he voted.");
		await giveRandomItem((await message.guild.members.fetch(entity.discordUser_id)).user, message.channel, language, entity);
	} else {
		//money win
		let moneyWon = draftbotRandom.integer(SMALL_EVENT.MINIMUM_MONEY_WON_VOTE, SMALL_EVENT.MAXIMUM_MONEY_WON_VOTE);
		seEmbed.setDescription(JsonReader.small_events.botVote.getTranslation(language).stories.moneyWin[randInt(0, JsonReader.small_events.botVote.getTranslation(language).stories.moneyWin.length)]);
		const msg = await message.channel.send(seEmbed);
		log(entity.discordUser_id + " won " + moneyWon + " money because he voted.");
	}
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};