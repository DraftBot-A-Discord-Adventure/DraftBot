import {giveRandomItem} from "../utils/ItemUtils";

const DBL = require("../DBL");
/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send. The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
const executeSmallEvent = async function(message, language, entity, seEmbed) {
	const trans = JsonReader.smallEvents.botVote.getTranslation(language);
	const transIntroSE = JsonReader.smallEventsIntros.getTranslation(language);
	const base = JsonReader.smallEvents.botVote.emote + " " + transIntroSE.intro[randInt(0, transIntroSE.intro.length)] + trans.stories[draftbotRandom.integer(0, trans.stories.length - 1)];

	if (await DBL.getTimeBeforeDBLRoleRemove(entity.discordUserId) < 0) {
		// hasn't voted
		seEmbed.setDescription(base + trans.pleaseVote + "\n\n" + trans.pleaseVoteFooter);
		await message.channel.send({ embeds: [seEmbed] });

	}
	else if (draftbotRandom.bool()) {
		// item win
		seEmbed.setDescription(base + trans.itemWin + "\n\n" + trans.thanksFooter);
		await message.channel.send({ embeds: [seEmbed] });
		await giveRandomItem((await message.guild.members.fetch(entity.discordUserId)).user, message.channel, language, entity);

	}
	else {
		// money win
		const moneyWon = draftbotRandom.integer(SMALL_EVENT.MINIMUM_MONEY_WON_VOTE, SMALL_EVENT.MAXIMUM_MONEY_WON_VOTE);
		entity.Player.addMoney(moneyWon);
		seEmbed.setDescription(base + format(trans.moneyWin, {money: moneyWon}) + "\n\n" + trans.thanksFooter);
		await message.channel.send({ embeds: [seEmbed] });
	}
	await entity.Player.save();
	log(entity.discordUserId + " got botVote small event.");
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};