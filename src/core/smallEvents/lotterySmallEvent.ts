import {SmallEvent} from "./SmallEvent";
import Entity from "../models/Entity";
import {CommandInteraction, TextChannel} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {Maps} from "../Maps";
import {RandomUtils} from "../utils/RandomUtils";
import {format} from "../utils/StringFormatter";
import {BlockingUtils} from "../utils/BlockingUtils";
import {Guilds} from "../models/Guild";
import {Constants} from "../Constants";
import {Data} from "../Data";
import {DraftBotReactionMessageBuilder} from "../messages/DraftBotReactionMessage";
import {DraftBotReaction} from "../messages/DraftBotReaction";

export const smallEvent: SmallEvent = {
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	async executeSmallEvent(interaction: CommandInteraction, language: string, entity: Entity, seEmbed: DraftBotEmbed): Promise<void> {
		const translationLottery = Translations.getModule("smallEvents.lottery", language);
		seEmbed.setDescription(seEmbed.description + translationLottery.get("intro"));
		console.log(entity.discordUserId + " got a mini-event lottery.");

		const player = entity.Player;
		const lotteryData = Data.getModule("smallEvents.lottery");
		const emojiLottery = lotteryData.getStringArray("emojiLottery");

		const reactMsg = new DraftBotReactionMessageBuilder()
			.allowUser(interaction.user)
			.endCallback(async (msg) => {
				BlockingUtils.unblockPlayer(entity.discordUserId);
				const reaction = msg.getFirstReaction();

				if (!reaction) {
					seEmbed.setDescription(seEmbed.description + " " + translationLottery.get("end"));
					return await interaction.channel.send({embeds: [seEmbed]});
				}

				if (player.money < 175 && reaction.emoji.name === emojiLottery[2]) {
					seEmbed.setDescription(reaction.emoji.name + " " + translationLottery.get("poor"));
					return await interaction.channel.send({embeds: [seEmbed]});
				}
				const malus = emojiLottery[2] === reaction.emoji.name;
				let rewardType = lotteryData.getStringArray("rewardType");
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
				if (emojiLottery[0] !== reaction.emoji.name) {
					await Maps.applyEffect(player,":clock2:", lotteryData.getNumber("lostTime"));
				}
				const reward = RandomUtils.draftbotRandom.pick(rewardType);
				if (RandomUtils.draftbotRandom.bool(lotteryData.getNumber("successRate." + reaction.emoji.name)) && (guild || reward !== Constants.LOTTERY_REWARD_TYPES.GUILD_XP)) {
					console.log(entity.discordUserId + " got " + reward + " in smallEvent lottery");
					const coeff = lotteryData.getNumber("coeff." + reaction.emoji.name);
					switch (reward) {
					case Constants.LOTTERY_REWARD_TYPES.XP:
						await player.addExperience(Constants.SMALL_EVENT.LOTTERY_REWARDS.EXPERIENCE * coeff, entity, <TextChannel> interaction.channel, language);
						break;
					case Constants.LOTTERY_REWARD_TYPES.MONEY:
						await player.addMoney(entity, Constants.SMALL_EVENT.LOTTERY_REWARDS.MONEY * coeff, <TextChannel> interaction.channel, language);
						break;
					case Constants.LOTTERY_REWARD_TYPES.GUILD_XP:
						await guild.addExperience(Constants.SMALL_EVENT.LOTTERY_REWARDS.GUILD_EXPERIENCE * coeff, interaction.channel, language);
						await guild.save();
						break;
					case Constants.LOTTERY_REWARD_TYPES.POINTS:
						await player.addScore(entity, Constants.SMALL_EVENT.LOTTERY_REWARDS.POINTS * coeff, <TextChannel> interaction.channel, language);
						break;
					default:
						throw new Error("lottery reward type not found");
					}
					await player.save();
					await entity.save();
					const money = Constants.SMALL_EVENT.LOTTERY_REWARDS.MONEY * coeff;
					sentenceReward = format(translationLottery.getFromArray(reaction.emoji.name, 0), {
						lostTime: lotteryData.getNumber("lostTime")
					}) + format(translationLottery.get("rewardTypeText." + reward), {
						money: Math.abs(money),
						negativeMoney: money < 0,
						xpWon: Constants.SMALL_EVENT.LOTTERY_REWARDS.EXPERIENCE * coeff,
						guildXpWon: Constants.SMALL_EVENT.LOTTERY_REWARDS.GUILD_EXPERIENCE * coeff,
						pointsWon: Constants.SMALL_EVENT.LOTTERY_REWARDS.POINTS * coeff
					});
				}
				// eslint-disable-next-line no-dupe-else-if
				else if (malus && RandomUtils.draftbotRandom.bool(lotteryData.getNumber("successRate." + reaction.emoji.name))) {
					await player.addMoney(entity, -175, <TextChannel> interaction.channel, language);
					await player.save();
					sentenceReward = format(translationLottery.getFromArray(reaction.emoji.name, 2), {
						lostTime: lotteryData.getNumber("lostTime")
					}) + format(translationLottery.get("rewardTypeText.money"), {
						negativeMoney: true,
						money: 175
					});
				}
				else {
					sentenceReward = format(translationLottery.getFromArray(reaction.emoji.name,1), {
						lostTime: lotteryData.getNumber("lostTime")
					});
				}
				seEmbed.setDescription(reaction.emoji.name + " " + sentenceReward);
				return await interaction.channel.send({embeds: [seEmbed]});
			});

		for (const emoji of emojiLottery) {
			reactMsg.addReaction(new DraftBotReaction(emoji));
		}

		await reactMsg.build().reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(entity.discordUserId, "lottery", collector));
	}
};