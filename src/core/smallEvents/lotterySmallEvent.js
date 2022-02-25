/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send. The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
import {Translations} from "../Translations";
import {format} from "../utils/StringFormatter";
import {Guilds} from "../models/Guild";
import {Maps} from "../Maps";
import {Constants} from "../Constants";
import {BlockingUtils} from "../utils/BlockingUtils";

const executeSmallEvent = async function(message, language, entity, seEmbed) {
	const translationLottery = Translations.getModule("smallEvents.lottery", language);
	seEmbed.setDescription(JsonReader.smallEvents.lottery.emote + " " + translationLottery.get("intro"));
	log(entity.discordUserId + " got a mini-event lottery.");

	const player = entity.Player;
	const lotteryIntro = await message.channel.send({embeds: [seEmbed]});
	const emojiLottery = JsonReader.smallEvents.lottery.emojiLottery;

	const collectorLottery = lotteryIntro.createReactionCollector( {time: COLLECTOR_TIME,
		filter: (reaction, user) => emojiLottery.indexOf(reaction.emoji.name) !== -1 && user.id === message.author.id});
	collectorLottery.on("collect", () => {
		collectorLottery.stop();
	});

	collectorLottery.on("end", async (collected) => {
		BlockingUtils.unblockPlayer(entity.discordUserId);

		if (!collected.first()) {
			seEmbed.setDescription(JsonReader.smallEvents.lottery.emote + " " + translationLottery.get("end"));
			return await message.channel.send({embeds: [seEmbed]});
		}
		if (player.money < 175 && collected.first().emoji.name === emojiLottery[2]) {
			seEmbed.setDescription(collected.first().emoji.name + " " + translationLottery.get("poor"));
			return await message.channel.send({embeds: [seEmbed]});
		}
		const malus = emojiLottery[2] === collected.first().emoji.name;
		let rewardType = JsonReader.smallEvents.lottery.rewardType;
		let guild;
		try {
			guild = await Guilds.getById(entity.Player.guildId);
		}
		catch {
			guild = null;
		}
		if (guild === null || guild.isAtMaxLevel()) {
			rewardType = rewardType.filter(r => r !== Constants.LOTTERY_REWARD_TYPES.GUILD_XP);
		}
		let sentenceReward;
		if (emojiLottery[0] !== collected.first().emoji.name) {
			await Maps.applyEffect(player,":clock2:",JsonReader.smallEvents.lottery.lostTime);
		}
		const reward = draftbotRandom.pick(rewardType);
		if (draftbotRandom.bool(JsonReader.smallEvents.lottery.successRate[collected.first().emoji.name]) && (guild || reward !== Constants.LOTTERY_REWARD_TYPES.GUILD_XP)) {
			log(entity.discordUserId + " got " + reward + " in smallEvent lottery");
			const coeff = JsonReader.smallEvents.lottery.coeff[collected.first().emoji.name];
			switch (reward) {
			case Constants.LOTTERY_REWARD_TYPES.XP:
				player.addExperience(SMALL_EVENT.LOTTERY_REWARDS.EXPERIENCE * coeff, entity, message, language);
				player.save();
				break;
			case Constants.LOTTERY_REWARD_TYPES.MONEY:
				await player.addMoney(entity, SMALL_EVENT.LOTTERY_REWARDS.MONEY * coeff);
				player.save();
				break;
			case Constants.LOTTERY_REWARD_TYPES.GUILD_XP:
				guild.addExperience(SMALL_EVENT.LOTTERY_REWARDS.GUILD_EXPERIENCE * coeff, message, language);
				await guild.save();
				break;
			case Constants.LOTTERY_REWARD_TYPES.POINTS:
				await player.addScore(entity, SMALL_EVENT.LOTTERY_REWARDS.POINTS * coeff);
				player.save();
				break;
			default:
				throw new Error("lottery reward type not found");
			}
			const money = SMALL_EVENT.LOTTERY_REWARDS.MONEY * coeff;
			sentenceReward = format(translationLottery.getFromArray(collected.first().emoji.name,0), {
				lostTime: JsonReader.smallEvents.lottery.lostTime
			}) + format(translationLottery.get("rewardTypeText." + reward), {
				money: Math.abs(money),
				negativeMoney: money < 0,
				xpWon: SMALL_EVENT.LOTTERY_REWARDS.EXPERIENCE * coeff,
				guildXpWon: SMALL_EVENT.LOTTERY_REWARDS.GUILD_EXPERIENCE * coeff,
				pointsWon: SMALL_EVENT.LOTTERY_REWARDS.POINTS * coeff
			});
		}
		// eslint-disable-next-line no-dupe-else-if
		else if (malus && draftbotRandom.bool(JsonReader.smallEvents.lottery.successRate[collected.first().emoji.name])) {
			await player.addMoney(entity, -175, message.channel, language);
			player.save();
			sentenceReward = format(translationLottery.getFromArray(collected.first().emoji.name,2), {
				lostTime: JsonReader.smallEvents.lottery.lostTime
			}) + format(translationLottery.get("rewardTypeText.money"), {
				negativeMoney: true,
				money: 175
			});
		}
		else {
			sentenceReward = format(translationLottery.getFromArray(collected.first().emoji.name,1), {
				lostTime: JsonReader.smallEvents.lottery.lostTime
			});
		}
		seEmbed.setDescription(collected.first().emoji.name + " " + sentenceReward);
		return await message.channel.send({embeds: [seEmbed]});
	});


	await BlockingUtils.blockPlayerWithCollector(entity.discordUserId, "lottery", collectorLottery);
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
	smallEvent: {
		executeSmallEvent: executeSmallEvent,
		canBeExecuted: () => Promise.resolve(true)
	}
};