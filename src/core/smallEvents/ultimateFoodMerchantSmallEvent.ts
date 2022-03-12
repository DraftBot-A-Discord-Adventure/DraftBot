/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send.
 *    The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
import {Message, MessageEmbed, TextChannel, User} from "discord.js";
import {Translations} from "../Translations";
import {Data} from "../Data";
import {Guilds} from "../models/Guild";
import {generateRandomItem, giveItemToPlayer} from "../utils/ItemUtils";
import {Constants} from "../Constants";
import {SmallEvent} from "./SmallEvent";
import {RandomUtils} from "../utils/RandomUtils";
import {format} from "../utils/StringFormatter";

declare function giveFood(message: Message, language: string, entity: any, author: User, food: any, quantity: number): any;
declare function log(text: string): any;

export const smallEvent: SmallEvent = {
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},
	async executeSmallEvent(message: Message, language: string, entity: any, seEmbed: MessageEmbed) {

		async function generateReward(entity: any) {
			function minRarity(entity: any): number {
				return Math.floor(5 * Math.tanh(entity.Player.level / 125) + 1);
			}
			function maxRarity(entity: any): number {
				return Math.ceil(7 * Math.tanh(entity.Player.level / 62));
			}
			function ultimateFoodsAmount(entity: any, currentFoodLevel: number): number {
				let amount = Math.ceil(3 * Math.tanh(entity.Player.level / 100)) + RandomUtils.draftbotRandom.integer(-1, 1);
				if (amount > foodData.getNumber("max.ultimateFood") - currentFoodLevel) {
					amount = foodData.getNumber("max.ultimateFood") - currentFoodLevel;
				}
				return amount;
			}
			function commonFoodAmount(entity: any, currentFoodLevel: number): number {
				let amount = Math.ceil(6 * Math.tanh(entity.Player.level / 100) + 1) + RandomUtils.draftbotRandom.integer(-2, 2);
				if (amount > foodData.getNumber("max.commonFood") - currentFoodLevel) {
					amount = foodData.getNumber("max.commonFood") - currentFoodLevel;
				}
				if (amount <= 0) {
					amount = 1;
				}
				return amount;
			}

			let guild: any;
			try {
				guild = await Guilds.getById(entity.Player.guildId);
			}
			catch {
				guild = null;
			}

			const foodData = Data.getModule("commands.guildShop");
			if (guild !== null) {
				if (entity.Player.level >= Constants.SMALL_EVENT.MINIMUM_LEVEL_GOOD_PLAYER_FOOD_MERCHANT) {
					if (RandomUtils.draftbotRandom.bool()) {
						if (guild.ultimateFood < foodData.getNumber("max.ultimateFood")) {
							return {
								type: "ultimateFood",
								option: ultimateFoodsAmount(entity, guild.ultimateFood)
							};
						}
						return {
							type: "fullUltimateFood",
							option: 0
						};
					}
					return {
						type: "item",
						option: await generateRandomItem(maxRarity(entity), null, minRarity(entity))
					};
				}
				if (foodData.getNumber("max.commonFood") > guild.commonFood) {
					return {
						type: "commonFood",
						option: commonFoodAmount(entity, guild.commonFood)
					};
				}
				return {
					type: "fullCommonFood",
					option: 0
				};
			}
			return {
				type: "money",
				option: Constants.SMALL_EVENT.MINIMUM_MONEY_WON_ULTIMATE_FOOD_MERCHANT + entity.Player.level
			};
		}

		function generateEmbed(reward: any) {
			const tr = Translations.getModule("smallEvents.ultimateFoodMerchant", language);
			const intro = Translations.getModule("smallEventsIntros", language).getRandom("intro");

			seEmbed.setDescription(
				seEmbed.description
				+ intro
				+ tr.getRandom("intrigue")
				+ format(tr.getRandom("rewards." + reward.type), {reward: reward.option})
			);
			return seEmbed;
		}

		async function giveReward(reward: any) {
			switch (reward.type) {
			case "ultimateFood":
				await giveFood(message, language, entity, message.author, Data.getModule("food").getString("ultimateFood"), reward.option);
				log(entity.discordUserId + "got a good level small event and won" + reward.type + "ultimate food");
				break;
			case "fullUltimateFood":
				log(entity.discordUserId + "got a good level small event but didn't have enough space for ultimate soups");
				break;
			case "item":
				await giveItemToPlayer(entity, reward.option, language, message.author, <TextChannel> message.channel);
				log(entity.discordUserId + "got a good level small event and won" + reward.option.en.name);
				break;
			case "commonFood":
				await giveFood(message, language, entity, message.author, Data.getModule("food").getString("commonFood"), reward.option);
				log(entity.discordUserId + "got a good level small event and won" + reward.option + "common food");
				break;
			case "fullCommonFood":
				log(entity.discordUserId + "got a good level small event but didn't have enough space for common food");
				break;
			case "money":
				await entity.Player.addMoney(entity, reward.option, message.channel, language);
				log(entity.discordUserId + "got a good level small event and won" + reward.option + "💰");
				break;
			default:
				throw new Error("reward type not found");
			}
			entity.Player.save();
		}

		const reward = await generateReward(entity);
		await message.channel.send({embeds: [generateEmbed(reward)]});
		await giveReward(reward);
	}
};