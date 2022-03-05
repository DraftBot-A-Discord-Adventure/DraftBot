import {DraftBotShopMessageBuilder, ShopItem, ShopItemCategory} from "../../core/messages/DraftBotShopMessage";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {DraftBotErrorEmbed} from "../../core/messages/DraftBotErrorEmbed";
import {Translations} from "../../core/Translations";
import {Entities} from "../../core/models/Entity";
import {Guilds} from "../../core/models/Guild";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {MissionsController} from "../../core/missions/MissionsController";

module.exports.commandInfo = {
	name: "guildshop",
	aliases: ["gs"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED],
	guildRequired: true
};

/**
 * Displays the guild shop
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 */
const GuildShopCommand = async (message, language) => {
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}
	const guild = await Guilds.getById((await Entities.getOrRegister(message.author.id))[0].Player.guildId);
	const guildShopTranslations = Translations.getModule("commands.guildShop", language);
	const commonFoodRemainingSlots = Math.max(GUILD.MAX_COMMON_PET_FOOD - guild.commonFood, 1);
	const herbivorousFoodRemainingSlots = Math.max(GUILD.MAX_HERBIVOROUS_PET_FOOD - guild.herbivorousFood, 1);
	const carnivorousFoodRemainingSlots = Math.max(GUILD.MAX_CARNIVOROUS_PET_FOOD - guild.carnivorousFood, 1);
	const ultimateFoodRemainingSlots = Math.max(GUILD.MAX_ULTIMATE_PET_FOOD - guild.ultimateFood, 1);

	const shopMessage = new DraftBotShopMessageBuilder(
		message.author,
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
		.send(message.channel, (collector) => BlockingUtils.blockPlayerWithCollector(message.author.id, "guildShop", collector));
};

function shopEndCallback(shopMessage) {
	BlockingUtils.unblockPlayer(shopMessage.user.id);
}

function getGuildXPShopItem(guildShopTranslations) {
	return new ShopItem(
		guildShopTranslations.get("guildXp.emote"),
		guildShopTranslations.get("guildXp.name"),
		parseInt(guildShopTranslations.get("guildXp.price")),
		guildShopTranslations.get("guildXp.info"),
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			const guild = await Guilds.getById(entity.Player.guildId);
			const xpToAdd = randInt(50, 450);
			await guild.addExperience(xpToAdd, message.sentMessage, message.language);

			await guild.save();
			await message.sentMessage.channel.send({ embeds: [
				new DraftBotEmbed()
					.formatAuthor(guildShopTranslations.get("successNormal"), message.user)
					.setDescription(format(guildShopTranslations.get("guildXp.give"), {
						experience: xpToAdd
					}))] }
			);
			return true;
		}
	);
}

function getFoodShopItem(guildShopTranslations, name, language, amounts) {
	const foodJson = JsonReader.food[name];
	return new ShopItem(
		foodJson.emote,
		foodJson.translations[language].name,
		foodJson.price,
		foodJson.translations[language].info,
		async (message, amount) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			const guild = await Guilds.getById(entity.Player.guildId);
			if (isStorageFullFor(foodJson, amount, guild)) {
				await message.sentMessage.channel.send({ embeds: [new DraftBotErrorEmbed(message.user, language, guildShopTranslations.get("fullStock"))] });
				return false;
			}
			await giveFood(message.sentMessage, message.language, entity, message.user, foodJson, amount);
			if (name === "ultimateFood") {
				await MissionsController.update(entity.discordUserId, message.sentMessage.channel, language, "buyUltimateSoups", amount);
			}
			return true;
		},
		amounts
	);
}

module.exports.execute = GuildShopCommand;