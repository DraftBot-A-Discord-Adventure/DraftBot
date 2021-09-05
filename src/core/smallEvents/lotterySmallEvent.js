/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send. The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
const executeSmallEvent = async function(message, language, entity, seEmbed) {
	const translationLottery = JsonReader.smallEvents.lottery.getTranslation(language);
	seEmbed.setDescription(JsonReader.smallEvents.lottery.emote + translationLottery.intro);
	log(entity.discordUserId + " got a mini-event lottery.");
	const lotteryIntro = await message.channel.send(seEmbed);
	const emojiLottery = JsonReader.smallEvents.lottery.emojiLottery;
	const collectorLottery = lotteryIntro.createReactionCollector((reaction, user) => emojiLottery.indexOf(reaction.emoji.name) !== -1 && user.id === message.author.id, {time: COLLECTOR_TIME});
	collectorLottery.on("collect", () => {
		collectorLottery.stop();
	});

	collectorLottery.on("end", async (collected) => {
		await removeBlockedPlayer(entity.discordUserId);
		if (!collected.first()) {
			seEmbed.setDescription(JsonReader.smallEvents.lottery.emote + translationLottery.end);
			return await message.channel.send(seEmbed);
		}
		const malus = emojiLottery[2] === collected.first().emoji.name;
		const rewardType = JsonReader.smallEvents.lottery.rewardType;
		let sentenceReward;
		const player = entity.Player;
		if (draftbotRandom.bool(JsonReader.smallEvents.lottery.successRate[collected.first().emoji.name])) {
			const reward = draftbotRandom.pick(rewardType);
			log(entity.discordUserId + " got " + reward + " in smallEvent lottery");
			const coeff = JsonReader.smallEvents.lottery.coeff[collected.first().emoji.name];
			const guild = await Guilds.getById(entity.Player.guildId);
			switch (reward) {
			case rewardType[0]:
				player.experience += 50 * coeff;
				player.save();
				break;
			case rewardType[1]:
				player.addMoney(75 * coeff);
				player.save();
				break;
			case rewardType[2]:
				guild.addExperience(90 * coeff);
				await guild.save();
				break;
			case rewardType[3]:
				player.addScore(50 * coeff);
				player.save();
				break;
			default:
				throw new Error("Ceci n'est pas censé arriver.");
			}
			sentenceReward = translationLottery[collected.first().emoji.name][0] + format(translationLottery.rewardTypeText[reward],{
				moneyWon: 75 * coeff,
				xpWon: 50 * coeff,
				guildXpWon: 90 * coeff,
				pointsWon: 50 * coeff
			});
		}
		// eslint-disable-next-line no-dupe-else-if
		else if (malus && draftbotRandom.bool(JsonReader.smallEvents.lottery.successRate[collected.first().emoji.name])) {
			player.addMoney(-100);
			player.save();
			sentenceReward = translationLottery[collected.first().emoji.name][2] + format(translationLottery.rewardTypeText.money,{moneyWon: -100});
		}
		else {
			sentenceReward = translationLottery[collected.first().emoji.name][1];
		}
		seEmbed.setDescription(collected.first().emoji.name + sentenceReward);
		return await message.channel.send(seEmbed);
	});

	await addBlockedPlayer(entity.discordUserId, "lottery", collectorLottery);
	for (let i = 0; i < emojiLottery.length; ++i) {
		try {
			await lotteryIntro.react(emojiLottery[i]);
		}
		catch (e) {
			console.error(e);
		}
	}
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};