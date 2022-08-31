import {CommandInteraction, MessageEmbed} from "discord.js";
import {Translations} from "../Translations";
import Guild, {Guilds} from "../database/game/models/Guild";
import {generateRandomItem, giveItemToPlayer} from "../utils/ItemUtils";
import {Constants} from "../Constants";
import {SmallEvent} from "./SmallEvent";
import {RandomUtils} from "../utils/RandomUtils";
import {format} from "../utils/StringFormatter";
import {giveFood} from "../utils/GuildUtils";
import {NumberChangeReason} from "../database/logs/LogsDatabase";
import Entity from "../database/game/models/Entity";
import {GenericItemModel} from "../database/game/models/GenericItemModel";

type RewardType = { type: string, option: number | GenericItemModel };

function minRarity(entity: Entity): number {
	return Math.floor(5 * Math.tanh(entity.Player.level / 125) + 1);
}

function maxRarity(entity: Entity): number {
	return Math.ceil(7 * Math.tanh(entity.Player.level / 62));
}

function ultimateFoodsAmount(entity: Entity, currentFoodLevel: number): number {
	return Math.min(Math.ceil(3 * Math.tanh(entity.Player.level / 100)) + RandomUtils.draftbotRandom.integer(-1, 1), Constants.GUILD.MAX_ULTIMATE_PET_FOOD - currentFoodLevel, 1);
}

function commonFoodAmount(entity: Entity, currentFoodLevel: number): number {
	return Math.min(Math.ceil(6 * Math.tanh(entity.Player.level / 100) + 1) + RandomUtils.draftbotRandom.integer(-2, 2), Constants.GUILD.MAX_COMMON_PET_FOOD - currentFoodLevel, 1);
}

async function generateReward(entity: Entity): Promise<RewardType> {
	let guild: Guild;
	try {
		guild = await Guilds.getById(entity.Player.guildId);
	}
	catch {
		guild = null;
	}
	if (guild === null) {
		return {
			type: "money",
			option: Constants.SMALL_EVENT.MINIMUM_MONEY_WON_ULTIMATE_FOOD_MERCHANT + entity.Player.level
		};
	}
	if (entity.Player.level >= Constants.SMALL_EVENT.MINIMUM_LEVEL_GOOD_PLAYER_FOOD_MERCHANT) {
		return RandomUtils.draftbotRandom.bool() ? guild.ultimateFood < Constants.GUILD.MAX_ULTIMATE_PET_FOOD ? {
			type: "ultimateFood",
			option: ultimateFoodsAmount(entity, guild.ultimateFood)
		} : {
			type: "fullUltimateFood",
			option: 0
		} : {
			type: "item",
			option: await generateRandomItem(maxRarity(entity), null, minRarity(entity))
		};
	}
	if (Constants.GUILD.MAX_COMMON_PET_FOOD > guild.commonFood) {
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

function generateEmbed(reward: RewardType, seEmbed: MessageEmbed, language: string): MessageEmbed {
	const tr = Translations.getModule("smallEvents.ultimateFoodMerchant", language);
	const intro = Translations.getModule("smallEventsIntros", language).getRandom("intro");

	seEmbed.setDescription(
		seEmbed.description
		+ intro
		+ tr.getRandom("intrigue")
		+ format(tr.getRandom(`rewards.${reward.type}`), {reward: reward.option as number})
	);
	return seEmbed;
}

async function giveReward(reward: RewardType, interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	switch (reward.type) {
	case "ultimateFood":
		await giveFood(interaction, language, entity, Constants.PET_FOOD.ULTIMATE_FOOD, reward.option as number, NumberChangeReason.SMALL_EVENT);
		break;
	case "fullUltimateFood":
		break;
	case "item":
		await giveItemToPlayer(entity, reward.option as GenericItemModel, language, interaction.user, interaction.channel);
		break;
	case "commonFood":
		await giveFood(interaction, language, entity, Constants.PET_FOOD.COMMON_FOOD, reward.option as number, NumberChangeReason.SMALL_EVENT);
		break;
	case "fullCommonFood":
		break;
	case "money":
		await entity.Player.addMoney(entity, reward.option as number, interaction.channel, language, NumberChangeReason.SMALL_EVENT);
		break;
	default:
		throw new Error("reward type not found");
	}
	await entity.Player.save();
}

export const smallEvent: SmallEvent = {
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},
	async executeSmallEvent(interaction: CommandInteraction, language: string, entity: Entity, seEmbed: MessageEmbed) {
		const reward = await generateReward(entity);
		await interaction.reply({embeds: [generateEmbed(reward, seEmbed, language)]});
		await giveReward(reward, interaction, language, entity);
	}
};