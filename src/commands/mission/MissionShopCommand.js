import {
	DraftBotShopMessageBuilder,
	ShopItem,
	ShopItemCategory
} from "../../core/messages/DraftBotShopMessage";
import {Translations} from "../../core/Translations";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {giveItemToPlayer, giveRandomItem} from "../../core/utils/ItemUtils";
import {Constants} from "../../core/Constants";
import {DraftBotReactionMessageBuilder} from "../../core/messages/DraftBotReactionMessage";
import {DraftBotErrorEmbed} from "../../core/messages/DraftBotErrorEmbed";
import {DraftBotReaction} from "../../core/messages/DraftBotReaction";
import {format} from "../../core/utils/StringFormatter";
import {Potions} from "../../core/models/Potion";
import {Entities} from "../../core/models/Entity";

import {Maps} from "../../core/Maps";
import Shop from "../../core/models/Shop";

module.exports.commandInfo = {
	name: "missionshop",
	aliases: ["ms","mshop"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED]
};

/**
 * Displays the mission shop
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 */
const MissionShopCommand = async (message, language) => {
	const [entity] = await Entities.getOrRegister(message.author.id);

	if (await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED], entity) !== true) {
		return;
	}
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}

	const shopTranslations = Translations.getModule("commands.missionShop", language);

	const itemsCategory = new ShopItemCategory(
		[
			getSkipMapMissionShopItem(shopTranslations),
			getMoneyShopItem(shopTranslations),
			getValuableItemShopItem(shopTranslations),
			getAThousandPointsShopItem(shopTranslations),
			getValueLovePointsPetShopItem(shopTranslations),
			getBadgeShopItem(shopTranslations)
		],
		shopTranslations.get("items")
	);

	const shopMessage = (await new DraftBotShopMessageBuilder(
		message.author,
		shopTranslations.get("title"),
		language
	)
		.addCategory(itemsCategory)
		.endCallback(shopEndCallback)
		.setGetUserMoney(getUserGems)
		.setRemoveUserMoney(removeUserMoney)
		.build())
		.send(message.channel);

	addBlockedPlayer(entity.discordUserId, "missionShop", shopMessage.collector);
};


let getUserGems = async (userId) =>	{
	let user = (await Entities.getOrRegister(userId))[0].Player;
	return user.MissionsInfo.gems;
}

async function removeUserMoney(userId,amount) {
	const player = (await Entities.getByDiscordUserId(userId)).Player;
	player.MissionsInfo.addGems(amount);
	await player.save();
}

function shopEndCallback(shopMessage) {
	removeBlockedPlayer(shopMessage.user.id);
}

function getItemShopItem(name, translationModule, buyCallback) {
	return new ShopItem(
		translationModule.get("items." + name + ".emote"),
		translationModule.get("items." + name + ".name"),
		parseInt(translationModule.get("items." + name + ".price")),
		translationModule.get("items." + name + ".info"),
		buyCallback
	);
}

function getSkipMapMissionShopItem(translationModule) {
	return getItemShopItem(
		"skipMapMission",
		translationModule,
		async (message) => {
			// TODO
			return true;
		});
}

function getMoneyShopItem(translationModule) {
	return getItemShopItem(
		"money",
		translationModule,
		async (message) => {
			// TODO
			return true;
		});
}

function getValuableItemShopItem(translationModule) {
	return getItemShopItem(
		"valuableItem",
		translationModule,
		async (message) => {
			// TODO
			return true;
		});
}

function getAThousandPointsShopItem(translationModule) {
	return getItemShopItem(
		"1000Points",
		translationModule,
		async (message) => {
			// TODO
			return true;
		});
}

function getValueLovePointsPetShopItem(translationModule) {
	return getItemShopItem(
		"lovePointsValue",
		translationModule,
		async (message) => {
			// TODO
			return true;
		});
}

function getBadgeShopItem(translationModule) {
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
