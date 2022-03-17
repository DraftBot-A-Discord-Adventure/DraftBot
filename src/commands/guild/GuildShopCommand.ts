import {
	DraftBotShopMessage,
	DraftBotShopMessageBuilder,
	ShopItem,
	ShopItemCategory
} from "../../core/messages/DraftBotShopMessage";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {DraftBotErrorEmbed} from "../../core/messages/DraftBotErrorEmbed";
import {TranslationModule, Translations} from "../../core/Translations";
import Entity, {Entities} from "../../core/models/Entity";
import {Guilds} from "../../core/models/Guild";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {MissionsController} from "../../core/missions/MissionsController";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction, TextChannel, User} from "discord.js";
import {randomInt} from "crypto";
import {giveFood, isStorageFullFor} from "../../core/utils/GuildUtils";


declare function sendBlockedError(user: User, channel: TextChannel, language: string): Promise<boolean>;

/**
 * Displays the guild shop
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity) {
	if (await sendBlockedError(interaction.user, <TextChannel>interaction.channel, language)) {
		return;
	}
	const guild = await Guilds.getById(entity.Player.guildId);
	const guildShopTranslations = Translations.getModule("commands.guildShop", language);
	const commonFoodRemainingSlots = Math.max(Constants.GUILD.MAX_COMMON_PET_FOOD - guild.commonFood, 1);
	const herbivorousFoodRemainingSlots = Math.max(Constants.GUILD.MAX_HERBIVOROUS_PET_FOOD - guild.herbivorousFood, 1);
	const carnivorousFoodRemainingSlots = Math.max(Constants.GUILD.MAX_CARNIVOROUS_PET_FOOD - guild.carnivorousFood, 1);
	const ultimateFoodRemainingSlots = Math.max(Constants.GUILD.MAX_ULTIMATE_PET_FOOD - guild.ultimateFood, 1);

	const shopMessage = new DraftBotShopMessageBuilder(
		interaction.user,
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
			getFoodShopItem(guildShopTranslations, "commonFood", language, [1, Math.min(5, commonFoodRemainingSlots), Math.min(10, commonFoodRemainingSlots)]),
			getFoodShopItem(guildShopTranslations, "herbivorousFood", language, [1, Math.min(5, herbivorousFoodRemainingSlots), Math.min(10, herbivorousFoodRemainingSlots)]),
			getFoodShopItem(guildShopTranslations, "carnivorousFood", language, [1, Math.min(5, carnivorousFoodRemainingSlots), Math.min(10, carnivorousFoodRemainingSlots)]),
			getFoodShopItem(guildShopTranslations, "ultimateFood", language, [1, Math.min(5, ultimateFoodRemainingSlots)])
		],
		guildShopTranslations.get("foodItem")
	))
		.endCallback(shopEndCallback)
		.build())
		.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(interaction.user.id, "guildShop", collector));
}

function shopEndCallback(shopMessage: DraftBotShopMessage) {
	BlockingUtils.unblockPlayer(shopMessage.user.id);
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
			await guild.addExperience(xpToAdd, message.sentMessage, message.language);

			await guild.save();
			await message.sentMessage.channel.send({ embeds: [
				new DraftBotEmbed()
					.formatAuthor(guildShopTranslations.get("successNormal"), message.user)
					.setDescription(guildShopTranslations.format("guildXp.give", {
						experience: xpToAdd
					}))] }
			);
			return true;
		}
	);
}

function getFoodShopItem(guildShopTranslations: TranslationModule, name: string, language: string, amounts: number[]) {
	const foodJson = Translations.getModule("food", language);
	const indexFood = Constants.PET_FOOD.TYPE.indexOf(name);
	return new ShopItem(
		Constants.PET_FOOD.EMOTE[indexFood],
		foodJson.get(name + ".name"),
		Constants.PET_FOOD.PRICE[indexFood],
		foodJson.get(name + ".info"),
		async (message, amount) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			const guild = await Guilds.getById(entity.Player.guildId);
			if (isStorageFullFor(name, amount, guild)) {
				await message.sentMessage.channel.send({embeds: [new DraftBotErrorEmbed(message.user, language, guildShopTranslations.get("fullStock"))]});
				return false;
			}
			await giveFood(message.sentMessage, message.language, entity, message.user, name, amount);
			if (name === "ultimateFood") {
				await MissionsController.update(entity.discordUserId, <TextChannel>message.sentMessage.channel, language, "buyUltimateSoups", amount);
			}
			return true;
		},
		amounts
	);
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("guildshop")
		.setDescription("Affiche le shop des guildes à des fins d'achats"),
	executeCommand,
	requirements: {
		allowEffects: null,
		requiredLevel: null,
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD, Constants.EFFECT.LOCKED],
		guildPermissions: null,
		guildRequired: true,
		userPermission: null
	},
	mainGuildCommand: false,
	slashCommandPermissions: null
};