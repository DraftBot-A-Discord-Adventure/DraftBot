import {
	DraftBotShopMessage,
	DraftBotShopMessageBuilder,
	ShopItem,
	ShopItemCategory
} from "../../core/messages/DraftBotShopMessage";
import {TranslationModule, Translations} from "../../core/Translations";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Constants} from "../../core/Constants";
import {Entities} from "../../core/models/Entity";

import {Collector, Message, TextBasedChannels, User} from "discord.js";
import {generateRandomItem, giveItemToPlayer} from "../../core/utils/ItemUtils";
declare function removeBlockedPlayer(id: string): void;
declare function addBlockedPlayer(id: string, reason: string, collector: Collector<any, any, any[]>): void;
declare function sendBlockedError(user: User, channel: TextBasedChannels, language: string) : boolean;
declare function sendErrorMessage(user: User, channel: TextBasedChannels, language: string, reason: string) : boolean;

module.exports.commandInfo = {
	name: "missionshop",
	aliases: ["ms","mshop"],
	disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD, Constants.EFFECT.LOCKED]
};

/**
 * Displays the mission shop
 * @param {Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 */
const MissionShopCommand = async (message: Message, language: string) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}

	const shopTranslations = Translations.getModule("commands.missionShop", language);

	const resCategory = new ShopItemCategory(
		[
			getMoneyShopItem(shopTranslations),
			getValuableItemShopItem(shopTranslations),
			getAThousandPointsShopItem(shopTranslations),
		],
		shopTranslations.get("resTitle")
	);
	const utilCategory = new ShopItemCategory(
		[
			getSkipMapMissionShopItem(shopTranslations),
			getValueLovePointsPetShopItem(shopTranslations),
		],
		shopTranslations.get("utilTitle")
	);
	const presCategory = new ShopItemCategory(
		[
			getBadgeShopItem(shopTranslations)
		],
		shopTranslations.get("presTitle")
	);

	const shopMessage = (await new DraftBotShopMessageBuilder(
		message.author,
		shopTranslations.get("title"),
		language
	)
		.addCategory(resCategory)
		.addCategory(utilCategory)
		.addCategory(presCategory)
		.endCallback(shopEndCallback)
		.setGetUserMoney(getUserGems)
		.setRemoveUserMoney(removeUserMoney)
		.setTranslationPosition("commands.missionShop")
		.build())

	addBlockedPlayer(entity.discordUserId, "missionShop", shopMessage.collector);
	await shopMessage.send(message.channel);
};


let getUserGems = async (userId: string) : Promise<number> =>	{
	let user = (await Entities.getOrRegister(userId))[0].Player;
	return user.PlayerMissionsInfo.gems;
}

async function removeUserMoney(userId: string,amount: number) : Promise<void> {
	const player = (await Entities.getByDiscordUserId(userId)).Player;
	player.PlayerMissionsInfo.addGems(-amount);
	await player.save();
}

function shopEndCallback(shopMessage: DraftBotShopMessage) {
	removeBlockedPlayer(shopMessage.user.id);
}

function getItemShopItem(name: string, translationModule: TranslationModule, buyCallback: (message: DraftBotShopMessage, amount: number) => Promise<boolean>) : ShopItem {
	return new ShopItem(
		translationModule.get("items." + name + ".emote"),
		translationModule.get("items." + name + ".name"),
		parseInt(translationModule.get("items." + name + ".price")),
		translationModule.get("items." + name + ".info"),
		buyCallback
	);
}

function getSkipMapMissionShopItem(translationModule: TranslationModule) : ShopItem {
	return getItemShopItem(
		"skipMapMission",
		translationModule,
		async (message) => {
			// TODO
			return true;
		});
}

function getMoneyShopItem(translationModule: TranslationModule) : ShopItem {
	return getItemShopItem(
		"money",
		translationModule,
		async (message) => {
			// TODO sent message réponse
			const [entity] = await Entities.getOrRegister(message.user.id);
			entity.Player.addMoney(Constants.MISSION_SHOP.RATIO_MONEY_GEMS);
			return true;
		});
}

function getValuableItemShopItem(translationModule: TranslationModule) : ShopItem {
	return getItemShopItem(
		"valuableItem",
		translationModule,
		async (message) => {
			// TODO sent message réponse
			const [entity] = await Entities.getOrRegister(message.user.id);
			const item = await generateRandomItem(Constants.RARITY.MYTHICAL, null, Constants.RARITY.SPECIAL);
			console.log(item.rarity);
			await giveItemToPlayer(entity, item, message.language, message.user, message.sentMessage.channel);
			return true;
		});
}

function getAThousandPointsShopItem(translationModule: TranslationModule) : ShopItem {
	return getItemShopItem(
		"1000Points",
		translationModule,
		async (message) => {
			// TODO check cooldown 1 semaine
			const [entity] = await Entities.getOrRegister(message.user.id);
			entity.Player.addScore(1000)
			entity.Player.addWeeklyScore(1000)
			await entity.Player.save()
			// TODO sent message réponse
			// TODO set cooldown
			return true;
		});
}

function getValueLovePointsPetShopItem(translationModule: TranslationModule) : ShopItem {
	return getItemShopItem(
		"lovePointsValue",
		translationModule,
		async (message) => {
			// TODO check si pet
			// TODO check lp pet
			// TODO sent message réponse avec tip
			return true;
		});
}

function getBadgeShopItem(translationModule: TranslationModule) : ShopItem {
	return getItemShopItem(
		"badge",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			if (entity.Player.hasBadge("💍")) {
				await sendErrorMessage(message.user, message.sentMessage.channel, message.language, translationModule.get("error.alreadyHasItem"));
				return false;
			}
			entity.Player.addBadge("💍");
			await entity.Player.save();
			await message.sentMessage.channel.send({ embeds: [new DraftBotEmbed()
				.formatAuthor(translationModule.get("items.badge.give"), message.user)
				.setDescription("💍 " + translationModule.get("items.badge.name"))
			] });
			return true;
		}
	);
}

module.exports.execute = MissionShopCommand;
