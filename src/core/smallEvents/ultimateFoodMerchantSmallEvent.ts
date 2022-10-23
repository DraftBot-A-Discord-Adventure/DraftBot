import {CommandInteraction} from "discord.js";
import {Translations} from "../Translations";
import Guild, {Guilds} from "../database/game/models/Guild";
import {generateRandomItem, giveItemToPlayer} from "../utils/ItemUtils";
import {Constants} from "../Constants";
import {SmallEvent} from "./SmallEvent";
import {RandomUtils} from "../utils/RandomUtils";
import {format} from "../utils/StringFormatter";
import {giveFood} from "../utils/GuildUtils";
import {NumberChangeReason} from "../constants/LogsConstants";
import {GenericItemModel} from "../database/game/models/GenericItemModel";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import Player from "../database/game/models/Player";
import {InventorySlots} from "../database/game/models/InventorySlot";

type RewardType = { type: string, option: number | GenericItemModel };

/**
 * Defines the minimal amount of food you can get
 * @param player
 */
function minRarity(player: Player): number {
	return Math.floor(5 * Math.tanh(player.level / 125) + 1);
}

/**
 * Defines the maximal amount of food you can get
 * @param player
 */
function maxRarity(player: Player): number {
	return Math.ceil(7 * Math.tanh(player.level / 62));
}

/**
 * Says how many soups should be awarded
 * @param player
 * @param currentFoodLevel
 */
function ultimateFoodsAmount(player: Player, currentFoodLevel: number): number {
	return Math.max(Math.min(Math.ceil(3 * Math.tanh(player.level / 100)) + RandomUtils.draftbotRandom.integer(-1, 1), Constants.GUILD.MAX_ULTIMATE_PET_FOOD - currentFoodLevel), 1);
}

/**
 * Says how much common food should be awarded
 * @param player
 * @param currentFoodLevel
 */
function commonFoodAmount(player: Player, currentFoodLevel: number): number {
	return Math.max(Math.min(Math.ceil(6 * Math.tanh(player.level / 100) + 1) + RandomUtils.draftbotRandom.integer(-2, 2), Constants.GUILD.MAX_COMMON_PET_FOOD - currentFoodLevel), 1);
}

/**
 * Generates the reward of the current small event
 * @param player
 */
async function generateReward(player: Player): Promise<RewardType> {
	let guild: Guild;
	try {
		guild = await Guilds.getById(player.guildId);
	}
	catch {
		guild = null;
	}
	if (guild === null) {
		return {
			type: "money",
			option: Constants.SMALL_EVENT.MINIMUM_MONEY_WON_ULTIMATE_FOOD_MERCHANT + player.level
		};
	}
	if (player.level >= Constants.SMALL_EVENT.MINIMUM_LEVEL_GOOD_PLAYER_FOOD_MERCHANT) {
		return RandomUtils.draftbotRandom.bool() ? guild.ultimateFood < Constants.GUILD.MAX_ULTIMATE_PET_FOOD ? {
			type: "ultimateFood",
			option: ultimateFoodsAmount(player, guild.ultimateFood)
		} : {
			type: "fullUltimateFood",
			option: 0
		} : {
			type: "item",
			option: await generateRandomItem(maxRarity(player), null, minRarity(player))
		};
	}
	if (Constants.GUILD.MAX_COMMON_PET_FOOD > guild.commonFood) {
		return {
			type: "commonFood",
			option: commonFoodAmount(player, guild.commonFood)
		};
	}
	return {
		type: "fullCommonFood",
		option: 0
	};

}

/**
 * Generates the resulting embed of the small event
 * @param reward
 * @param seEmbed
 * @param language
 */
function generateEmbed(reward: RewardType, seEmbed: DraftBotEmbed, language: string): DraftBotEmbed {
	const tr = Translations.getModule("smallEvents.ultimateFoodMerchant", language);
	const intro = Translations.getModule("smallEventsIntros", language).getRandom("intro");

	seEmbed.setDescription(
		seEmbed.data.description
		+ intro
		+ tr.getRandom("intrigue")
		+ format(tr.getRandom(`rewards.${reward.type}`), {reward: reward.option as number})
	);
	return seEmbed;
}

/**
 * Gives the reward to the guild/player
 * @param reward
 * @param interaction
 * @param language
 * @param player
 */
async function giveReward(reward: RewardType, interaction: CommandInteraction, language: string, player: Player): Promise<void> {
	switch (reward.type) {
	case "ultimateFood":
		await giveFood(interaction, language, player, Constants.PET_FOOD.ULTIMATE_FOOD, reward.option as number, NumberChangeReason.SMALL_EVENT);
		break;
	case "fullUltimateFood":
		break;
	case "item":
		await giveItemToPlayer(player, reward.option as GenericItemModel, language, interaction.user, interaction.channel, await InventorySlots.getOfPlayer(player.id));
		break;
	case "commonFood":
		await giveFood(interaction, language, player, Constants.PET_FOOD.COMMON_FOOD, reward.option as number, NumberChangeReason.SMALL_EVENT);
		break;
	case "fullCommonFood":
		break;
	case "money":
		await player.addMoney({
			amount: reward.option as number,
			channel: interaction.channel,
			language,
			reason: NumberChangeReason.SMALL_EVENT
		});
		break;
	default:
		throw new Error("reward type not found");
	}
	await player.save();
}

export const smallEvent: SmallEvent = {
	/**
	 * No restrictions on who can do it
	 */
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	/**
	 * Gives a random amount of soup to the guild, or common food if not in a guild
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed) {
		const reward = await generateReward(player);
		await interaction.editReply({embeds: [generateEmbed(reward, seEmbed, language)]});
		await giveReward(reward, interaction, language, player);
	}
};