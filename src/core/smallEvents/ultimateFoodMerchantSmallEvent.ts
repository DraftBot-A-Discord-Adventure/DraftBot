import {CommandInteraction, MessageEmbed} from "discord.js";
import {Translations} from "../Translations";
import {Data} from "../Data";
import {Guilds} from "../models/Guild";
import {generateRandomItem, giveItemToPlayer} from "../utils/ItemUtils";
import {Constants} from "../Constants";
import {SmallEvent} from "./SmallEvent";
import {RandomUtils} from "../utils/RandomUtils";
import {format} from "../utils/StringFormatter";
import {giveFood} from "../utils/GuildUtils";

export const smallEvent: SmallEvent = {
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},
	async executeSmallEvent(interaction: CommandInteraction, language: string, entity: any, seEmbed: MessageEmbed) {

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
				await giveFood(interaction.channel, language, entity, interaction.user, Constants.PET_FOOD.ULTIMATE_FOOD, reward.option);
				console.log(entity.discordUserId + "got a good level small event and won" + reward.type + "ultimate food");
				break;
			case "fullUltimateFood":
				console.log(entity.discordUserId + "got a good level small event but didn't have enough space for ultimate soups");
				break;
			case "item":
				await giveItemToPlayer(entity, reward.option, language, interaction.user, interaction.channel);
				console.log(entity.discordUserId + "got a good level small event and won" + reward.option.en.name);
				break;
			case "commonFood":
				await giveFood(interaction.channel, language, entity, interaction.user, Constants.PET_FOOD.COMMON_FOOD, reward.option);
				console.log(entity.discordUserId + "got a good level small event and won" + reward.option + "common food");
				break;
			case "fullCommonFood":
				console.log(entity.discordUserId + "got a good level small event but didn't have enough space for common food");
				break;
			case "money":
				await entity.Player.addMoney(entity, reward.option, interaction.channel, language);
				console.log(entity.discordUserId + "got a good level small event and won" + reward.option + "💰");
				break;
			default:
				throw new Error("reward type not found");
			}
			entity.Player.save();
		}

		const reward = await generateReward(entity);
		await interaction.reply({embeds: [generateEmbed(reward)]});
		await giveReward(reward);
	}
};