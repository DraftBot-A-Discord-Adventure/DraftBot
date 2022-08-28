import {
	DraftBotShopMessage,
	DraftBotShopMessageBuilder,
	ShopItem,
	ShopItemCategory
} from "../../core/messages/DraftBotShopMessage";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {TranslationModule, Translations} from "../../core/Translations";
import Entity, {Entities} from "../../core/database/game/models/Entity";
import {Guilds} from "../../core/database/game/models/Guild";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {MissionsController} from "../../core/missions/MissionsController";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {randomInt} from "crypto";
import {sendErrorMessage} from "../../core/utils/ErrorUtils";
import {giveFood} from "../../core/utils/GuildUtils";
import {getFoodIndexOf} from "../../core/utils/FoodUtils";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {draftBotInstance} from "../../core/bot";
import {NumberChangeReason, ShopItemType} from "../../core/database/logs/LogsDatabase";

/**
 * Displays the guild shop
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity) {
	if (await sendBlockedError(interaction, language)) {
		return;
	}
	const guild = await Guilds.getById(entity.Player.guildId);
	const guildShopTranslations = Translations.getModule("commands.guildShop", language);
	const commonFoodRemainingSlots = Math.max(Constants.GUILD.MAX_COMMON_PET_FOOD - guild.commonFood, 1);
	const herbivorousFoodRemainingSlots = Math.max(Constants.GUILD.MAX_HERBIVOROUS_PET_FOOD - guild.herbivorousFood, 1);
	const carnivorousFoodRemainingSlots = Math.max(Constants.GUILD.MAX_CARNIVOROUS_PET_FOOD - guild.carnivorousFood, 1);
	const ultimateFoodRemainingSlots = Math.max(Constants.GUILD.MAX_ULTIMATE_PET_FOOD - guild.ultimateFood, 1);

	const shopMessage = new DraftBotShopMessageBuilder(
		interaction,
		guildShopTranslations.get("title"),
		language
	);
	if (!guild.isAtMaxLevel()) {
		shopMessage.addCategory(new ShopItemCategory(
			[
				getGuildXPShopItem(guildShopTranslations)
			],
			guildShopTranslations.get("xpItem")
		));
	}
	await (await shopMessage.addCategory(new ShopItemCategory(
		[
			getFoodShopItem(guildShopTranslations, "commonFood", [1, Math.min(5, commonFoodRemainingSlots), Math.min(10, commonFoodRemainingSlots)], interaction),
			getFoodShopItem(guildShopTranslations, "herbivorousFood", [1, Math.min(5, herbivorousFoodRemainingSlots), Math.min(10, herbivorousFoodRemainingSlots)], interaction),
			getFoodShopItem(guildShopTranslations, "carnivorousFood", [1, Math.min(5, carnivorousFoodRemainingSlots), Math.min(10, carnivorousFoodRemainingSlots)], interaction),
			getFoodShopItem(guildShopTranslations, "ultimateFood", [1, Math.min(5, ultimateFoodRemainingSlots)], interaction)
		],
		guildShopTranslations.get("foodItem")
	))
		.endCallback(shopEndCallback)
		.build())
		.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(interaction.user.id, BlockingConstants.REASONS.GUILD_SHOP, collector));
}

function shopEndCallback(shopMessage: DraftBotShopMessage) {
	BlockingUtils.unblockPlayer(shopMessage.user.id, BlockingConstants.REASONS.GUILD_SHOP);
}

function getGuildXPShopItem(guildShopTranslations: TranslationModule) {
	return new ShopItem(
		guildShopTranslations.get("guildXp.emote"),
		guildShopTranslations.get("guildXp.name"),
		parseInt(guildShopTranslations.get("guildXp.price")),
		guildShopTranslations.get("guildXp.info"),
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			const guild = await Guilds.getById(entity.Player.guildId);
			const xpToAdd = randomInt(50, 450);
			await guild.addExperience(xpToAdd, message.sentMessage.channel, message.language, NumberChangeReason.SHOP);

			await guild.save();
			await message.sentMessage.channel.send({
				embeds: [
					new DraftBotEmbed()
						.formatAuthor(guildShopTranslations.get("successNormal"), message.user)
						.setDescription(guildShopTranslations.format("guildXp.give", {
							experience: xpToAdd
						}))]
			}
			);
			draftBotInstance.logsDatabase.logGuildShopBuyout(message.user.id, ShopItemType.GUILD_XP).then();
			return true;
		}
	);
}

function getFoodShopItem(guildShopTranslations: TranslationModule, name: string, amounts: number[], interaction: CommandInteraction) {
	const foodJson = Translations.getModule("food", guildShopTranslations.language);
	const indexFood = getFoodIndexOf(name);
	return new ShopItem(
		Constants.PET_FOOD_GUILD_SHOP.EMOTE[indexFood],
		foodJson.get(name + ".name"),
		Constants.PET_FOOD_GUILD_SHOP.PRICE[indexFood],
		foodJson.get(name + ".info"),
		async (message, amount) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			const guild = await Guilds.getById(entity.Player.guildId);
			if (guild.isStorageFullFor(name, amount)) {
				await sendErrorMessage(message.user, interaction, guildShopTranslations.language, guildShopTranslations.get("fullStock"));
				return false;
			}
			await giveFood(interaction, message.language, entity, name, amount, NumberChangeReason.SHOP);
			if (name === Constants.PET_FOOD.ULTIMATE_FOOD) {
				await MissionsController.update(entity, message.sentMessage.channel, guildShopTranslations.language, {
					missionId: "buyUltimateSoups",
					count: amount
				});
			}
			draftBotInstance.logsDatabase.logFoodGuildShopBuyout(entity.discordUserId, name, amount).then();
			return true;
		},
		amounts
	);
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("guildshop")
		.setDescription("Shows the guild's shop in order to buy guild related items"),
	executeCommand,
	requirements: {
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD, Constants.EFFECT.LOCKED],
		guildRequired: true
	},
	mainGuildCommand: false
};