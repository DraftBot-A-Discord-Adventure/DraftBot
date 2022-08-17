import {SmallEvent} from "./SmallEvent";
import Entity from "../database/game/models/Entity";
import {CommandInteraction, Message} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {Maps} from "../Maps";
import {format} from "../utils/StringFormatter";
import {BlockingUtils} from "../utils/BlockingUtils";
import {Guilds} from "../database/game/models/Guild";
import {Constants} from "../Constants";
import {Data} from "../Data";
import {RandomUtils} from "../utils/RandomUtils";
import {BlockingConstants} from "../constants/BlockingConstants";
import {NumberChangeReason} from "../database/logs/LogsDatabase";

export const smallEvent: SmallEvent = {
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	async executeSmallEvent(interaction: CommandInteraction, language: string, entity: Entity, seEmbed: DraftBotEmbed): Promise<void> {
		const translationLottery = Translations.getModule("smallEvents.lottery", language);
		const seEmbedEmote = seEmbed.description;
		seEmbed.setDescription(seEmbed.description + translationLottery.get("intro"));

		const player = entity.Player;
		const lotteryIntro = await interaction.reply({embeds: [seEmbed], fetchReply: true}) as Message;
		const dataLottery = Data.getModule("smallEvents.lottery");
		const emojiLottery = dataLottery.getStringArray("emojiLottery");

		const collectorLottery = lotteryIntro.createReactionCollector({
			time: Constants.MESSAGES.COLLECTOR_TIME,
			filter: (reaction, user) => emojiLottery.indexOf(reaction.emoji.name) !== -1 && user.id === interaction.user.id
		});
		collectorLottery.on("collect", () => {
			collectorLottery.stop();
		});

		collectorLottery.on("end", async (collected) => {
			BlockingUtils.unblockPlayer(entity.discordUserId, BlockingConstants.REASONS.LOTTERY);

			if (!collected.first()) {
				seEmbed.setDescription(seEmbedEmote + translationLottery.get("end"));
				return await interaction.channel.send({embeds: [seEmbed]});
			}
			if (player.money < 175 && collected.first().emoji.name === emojiLottery[2]) {
				seEmbed.setDescription(collected.first().emoji.name + " " + translationLottery.get("poor"));
				return await interaction.channel.send({embeds: [seEmbed]});
			}
			const malus = emojiLottery[2] === collected.first().emoji.name;
			let rewardType = dataLottery.getStringArray("rewardType");
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
				await Maps.applyEffect(player, Constants.EFFECT.OCCUPIED, dataLottery.getNumber("lostTime"));
			}
			const reward = RandomUtils.draftbotRandom.pick(rewardType);
			if (RandomUtils.draftbotRandom.bool(dataLottery.getNumber("successRate." + collected.first().emoji.name)) && (guild || reward !== Constants.LOTTERY_REWARD_TYPES.GUILD_XP)) {
				const coeff = dataLottery.getNumber("coeff." + collected.first().emoji.name);
				switch (reward) {
				case Constants.LOTTERY_REWARD_TYPES.XP:
					await player.addExperience(Constants.SMALL_EVENT.LOTTERY_REWARDS.EXPERIENCE * coeff, entity, interaction.channel, language, NumberChangeReason.SMALL_EVENT);
					break;
				case Constants.LOTTERY_REWARD_TYPES.MONEY:
					await player.addMoney(entity, Constants.SMALL_EVENT.LOTTERY_REWARDS.MONEY * coeff, interaction.channel, language, NumberChangeReason.SMALL_EVENT);
					break;
				case Constants.LOTTERY_REWARD_TYPES.GUILD_XP:
					await guild.addExperience(Constants.SMALL_EVENT.LOTTERY_REWARDS.GUILD_EXPERIENCE * coeff, interaction.channel, language);
					await guild.save();
					break;
				case Constants.LOTTERY_REWARD_TYPES.POINTS:
					await player.addScore(entity, Constants.SMALL_EVENT.LOTTERY_REWARDS.POINTS * coeff, interaction.channel, language, NumberChangeReason.SMALL_EVENT);
					break;
				default:
					throw new Error("lottery reward type not found");
				}
				await player.save();
				await entity.save();
				const money = Constants.SMALL_EVENT.LOTTERY_REWARDS.MONEY * coeff;
				sentenceReward = format(translationLottery.getFromArray(collected.first().emoji.name, 0), {
					lostTime: dataLottery.getNumber("lostTime")
				}) + format(translationLottery.get("rewardTypeText." + reward), {
					money: Math.abs(money),
					negativeMoney: money < 0,
					xpWon: Constants.SMALL_EVENT.LOTTERY_REWARDS.EXPERIENCE * coeff,
					guildXpWon: Constants.SMALL_EVENT.LOTTERY_REWARDS.GUILD_EXPERIENCE * coeff,
					pointsWon: Constants.SMALL_EVENT.LOTTERY_REWARDS.POINTS * coeff
				});
			}
			// eslint-disable-next-line no-dupe-else-if
			else if (malus && RandomUtils.draftbotRandom.bool(dataLottery.getNumber("successRate." + collected.first().emoji.name))) {
				await player.addMoney(entity, -175, interaction.channel, language, NumberChangeReason.SMALL_EVENT);
				await player.save();
				sentenceReward = format(translationLottery.getFromArray(collected.first().emoji.name, 2), {
					lostTime: dataLottery.getNumber("lostTime")
				}) + format(translationLottery.get("rewardTypeText.money"), {
					negativeMoney: true,
					money: 175
				});
			}
			else {
				sentenceReward = format(translationLottery.getFromArray(collected.first().emoji.name, 1), {
					lostTime: dataLottery.getNumber("lostTime")
				});
			}
			seEmbed.setDescription(collected.first().emoji.name + " " + sentenceReward);
			return await interaction.channel.send({embeds: [seEmbed]});
		});


		BlockingUtils.blockPlayerWithCollector(entity.discordUserId, BlockingConstants.REASONS.LOTTERY, collectorLottery);
		for (let i = 0; i < emojiLottery.length; ++i) {
			try {
				await lotteryIntro.react(emojiLottery[i]);
			}
			catch (e) {
				console.error(e);
			}
		}
	}
};