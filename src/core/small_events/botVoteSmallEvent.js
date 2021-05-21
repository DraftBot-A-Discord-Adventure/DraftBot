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
	let trans = JsonReader.small_events.botVote.getTranslation(language);
	let base = JsonReader.small_events.botVote.emote + " " + trans.stories[draftbotRandom.integer(0, trans.stories.length - 1)];

	if (await DBL.getTimeBeforeDBLRoleRemove(entity.discordUser_id) < 0) {
		// hasn't voted
		seEmbed.setDescription(base + "\n\n" + trans.pleaseVote);
		const msg = await message.channel.send(seEmbed);

	} else if (draftbotRandom.bool()) {
		// item win
		seEmbed.setDescription(base + trans.itemWin + "\n\n" + trans.thanksFooter);
		const msg = await message.channel.send(seEmbed);
		await giveRandomItem((await message.guild.members.fetch(entity.discordUser_id)).user, message.channel, language, entity);

	} else {
		// money win
		let moneyWon = draftbotRandom.integer(SMALL_EVENT.MINIMUM_MONEY_WON_VOTE, SMALL_EVENT.MAXIMUM_MONEY_WON_VOTE);
		entity.Player.addMoney(moneyWon);
		seEmbed.setDescription(base + format(trans.moneyWin, {money: moneyWon}) + "\n\n" + trans.thanksFooter);
		const msg = await message.channel.send(seEmbed);
	}
	await entity.Player.save();
	log(entity.discordUser_id + " got botVote small event.");
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};