import {SmallEvent} from "./SmallEvent";
import {CommandInteraction, Message} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {format} from "../utils/StringFormatter";
import {BlockingUtils} from "../utils/BlockingUtils";
import Guild, {Guilds} from "../database/game/models/Guild";
import {Constants} from "../Constants";
import {Data, DataModule} from "../Data";
import {RandomUtils} from "../utils/RandomUtils";
import {BlockingConstants} from "../constants/BlockingConstants";
import {NumberChangeReason} from "../constants/LogsConstants";
import {EffectsConstants} from "../constants/EffectsConstants";
import {TravelTime} from "../maps/TravelTime";
import Player from "../database/game/models/Player";

async function getGuild(player: Player): Promise<Guild> {
	try {
		return await Guilds.getById(player.guildId);
	}
	catch {
		return null;
	}
}

async function effectIfGoodRisk(emoteName: string, player: Player, dataLottery: DataModule, now: Date): Promise<void> {
	const emojiLottery = dataLottery.getStringArray("emojiLottery");
	if (emoteName !== emojiLottery[0]) {
		await TravelTime.applyEffect(
			player,
			EffectsConstants.EMOJI_TEXT.OCCUPIED,
			dataLottery.getNumber("lostTime"),
			now,
			NumberChangeReason.SMALL_EVENT,
			now);
	}
}

export const smallEvent: SmallEvent = {
	/**
	 * No restrictions on who can do it
	 */
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	/**
	 * Plays to a game of lottery with a stranger
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const translationLottery = Translations.getModule("smallEvents.lottery", language);
		const seEmbedEmote = seEmbed.data.description;
		seEmbed.setDescription(seEmbed.data.description + translationLottery.get("intro"));

		const lotteryIntro = await interaction.editReply({embeds: [seEmbed]}) as Message;
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
			BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.LOTTERY);

			if (!collected.first()) {
				seEmbed.setDescription(seEmbedEmote + translationLottery.get("end"));
				return await interaction.channel.send({embeds: [seEmbed]});
			}
			if (player.money < 175 && collected.first().emoji.name === emojiLottery[2]) {
				seEmbed.setDescription(`${collected.first().emoji.name} ${translationLottery.get("poor")}`);
				return await interaction.channel.send({embeds: [seEmbed]});
			}
			const malus = emojiLottery[2] === collected.first().emoji.name;
			let rewardType = dataLottery.getStringArray("rewardType");
			const guild = await getGuild(player);
			if (guild === null || guild.isAtMaxLevel()) {
				rewardType = rewardType.filter(r => r !== Constants.LOTTERY_REWARD_TYPES.GUILD_XP);
			}
			let sentenceReward;
			await effectIfGoodRisk(collected.first().emoji.name, player, dataLottery, interaction.createdAt);
			const reward = RandomUtils.draftbotRandom.pick(rewardType);
			const editValuesParams = {
				player,
				channel: interaction.channel,
				language,
				reason: NumberChangeReason.SMALL_EVENT
			};
			if (RandomUtils.draftbotRandom.bool(dataLottery.getNumber(`successRate.${collected.first().emoji.name}`)) && (guild || reward !== Constants.LOTTERY_REWARD_TYPES.GUILD_XP)) {
				const coeff = dataLottery.getNumber(`coeff.${collected.first().emoji.name}`);
				switch (reward) {
				case Constants.LOTTERY_REWARD_TYPES.XP:
					await player.addExperience(Object.assign(editValuesParams, {
						amount: Constants.SMALL_EVENT.LOTTERY_REWARDS.EXPERIENCE * coeff
					}));
					break;
				case Constants.LOTTERY_REWARD_TYPES.MONEY:
					await player.addMoney(Object.assign(editValuesParams, {
						amount: Constants.SMALL_EVENT.LOTTERY_REWARDS.MONEY * coeff
					}));
					break;
				case Constants.LOTTERY_REWARD_TYPES.GUILD_XP:
					await guild.addExperience(Constants.SMALL_EVENT.LOTTERY_REWARDS.GUILD_EXPERIENCE * coeff, interaction.channel, language, NumberChangeReason.SMALL_EVENT);
					await guild.save();
					break;
				case Constants.LOTTERY_REWARD_TYPES.POINTS:
					await player.addScore(Object.assign(editValuesParams, {
						amount: Constants.SMALL_EVENT.LOTTERY_REWARDS.POINTS * coeff
					}));
					break;
				default:
					throw new Error("lottery reward type not found");
				}
				await player.save();
				const money = Constants.SMALL_EVENT.LOTTERY_REWARDS.MONEY * coeff;
				sentenceReward = format(translationLottery.getFromArray(collected.first().emoji.name, 0), {
					lostTime: dataLottery.getNumber("lostTime")
				}) + format(translationLottery.get(`rewardTypeText.${reward}`), {
					money: Math.abs(money),
					negativeMoney: money < 0,
					xpWon: Constants.SMALL_EVENT.LOTTERY_REWARDS.EXPERIENCE * coeff,
					guildXpWon: Constants.SMALL_EVENT.LOTTERY_REWARDS.GUILD_EXPERIENCE * coeff,
					pointsWon: Constants.SMALL_EVENT.LOTTERY_REWARDS.POINTS * coeff
				});
			}
			else if (malus && RandomUtils.draftbotRandom.bool(dataLottery.getNumber(`successRate.${collected.first().emoji.name}`))) {
				await player.addMoney(Object.assign(editValuesParams, {
					amount: -175
				}));
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
			seEmbed.setDescription(`${collected.first().emoji.name} ${sentenceReward}`);
			return await interaction.channel.send({embeds: [seEmbed]});
		});


		BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.LOTTERY, collectorLottery);
		for (const emote of emojiLottery) {
			try {
				await lotteryIntro.react(emote);
			}
			catch (e) {
				console.error(e);
			}
		}
	}
};