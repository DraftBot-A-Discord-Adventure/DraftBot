import {
	DraftBotShopMessageBuilder,
	ShopEndReason,
	ShopItem,
	ShopItemCategory
} from "../../core/messages/DraftBotShopMessage";
import {Translations} from "../../core/Translations";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

const Maps = require("../../core/Maps");

/**
 * Displays the shop
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 */
async function ShopCommand(language, message) {
	const [entity] = await Entities.getOrRegister(message.author.id);

	if (await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED], entity) !== true) {
		return;
	}
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}

	const shopTranslations = Translations.getModule("commands.shop", language);

	const permanentItemsCategory = new ShopItemCategory(
		[
			getRandomItemShopItem(shopTranslations),
			getHealAlterationShopItem(shopTranslations),
			getRegenShopItem(shopTranslations),
			getBadgeShopItem(shopTranslations)
		],
		shopTranslations.get("permanentItem")
	);
	const dailyItemsCategory = new ShopItemCategory(
		[await getDailyPotionShopItem(shopTranslations)],
		shopTranslations.get("dailyItem")
	);

	const shopMessage = (await new DraftBotShopMessageBuilder(
		message.author,
		shopTranslations.get("title"),
		language,
		async(userId) => (await Entities.getOrRegister(userId))[0].Player.money,
		async(userId, amount) => {
			const player = (await Entities.getOrRegister(userId))[0].Player;
			player.money -= amount;
			await player.save();
		}
	)
		.addCategory(dailyItemsCategory)
		.addCategory(permanentItemsCategory)
		.endCallback(shopEndCallback)
		.build())
		.send(message.channel);

	addBlockedPlayer(entity.discordUserId, "shop", shopMessage.collector);
}

function shopEndCallback(shopMessage, reason) {
	removeBlockedPlayer(shopMessage.user.id);
}

function getPermanentItemShopItem(name, translationModule, buyCallback) {
	return new ShopItem(
		translationModule.get("permanentItems." + name + ".emote"),
		translationModule.get("permanentItems." + name + ".name"),
		parseInt(translationModule.get("permanentItems." + name + ".price")),
		translationModule.get("permanentItems." + name + ".info"),
		buyCallback
	);
}

function getRandomItemShopItem(translationModule) {
	return getPermanentItemShopItem(
		"randomItem",
		translationModule,
		async(message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			await giveRandomItem(message.user, message.sentMessage.channel, message.language, entity);
			return true;
		});
}

function getHealAlterationShopItem(translationModule) {
	return getPermanentItemShopItem(
		"healAlterations",
		translationModule,
		async(message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			if (entity.Player.currentEffectFinished()) {
				await sendErrorMessage(message.user, message.sentMessage.channel, message.language, translationModule.get("error.nothingToHeal"));
				return false;
			}
			if (entity.Player.effect !== EFFECT.DEAD && entity.Player.effect !== EFFECT.LOCKED) {
				await Maps.removeEffect(entity.Player);
				await entity.Player.save();
			}
			await message.sentMessage.channel.send(new DraftBotEmbed()
				.formatAuthor(translationModule.get("success"), message.user)
				.setDescription(translationModule.get("permanentItems.healAlterations.give")));
			return true;
		}
	);
}

function getRegenShopItem(translationModule) {
	return getPermanentItemShopItem(
		"regen",
		translationModule,
		async(message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			await entity.setHealth(await entity.getMaxHealth());
			await entity.save();
			await message.sentMessage.channel.send(
				new DraftBotEmbed()
					.formatAuthor(translationModule.get("success"), message.user)
					.setDescription(translationModule.get("permanentItems.regen.give"))
			);
			return true;
		}
	);
}

function getBadgeShopItem(translationModule) {
	return getPermanentItemShopItem(
		"badge",
		translationModule,
		async(message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			if (entity.Player.hasBadge("🤑")) {
				await sendErrorMessage(message.user, message.sentMessage.channel, message.language, translationModule.get("error.alreadyHasItem"));
				return false;
			}
			entity.Player.addBadge("🤑");
			await entity.Player.save();
			await message.sentMessage.channel.send(new DraftBotEmbed()
				.formatAuthor(translationModule.get("permanentItems.badge.give"), message.user)
				.setDescription("🤑 " + translationModule.get("permanentItems.badge.name"))
			);
			return true;
		}
	);
}

async function getDailyPotionShopItem(translationModule) {
	const shopPotion = await Shop.findOne({
		attributes: ["shopPotionId"]
	});
	const potion = await Potions.findOne({
		where: {
			id: shopPotion.shopPotionId
		}
	});

	return new ShopItem(
		potion.getEmoji(),
		potion.getSimplePotionName(translationModule.language) + " **| "
			+ potion.getRarityTranslation(translationModule.language) + " | "
			+ potion.getNatureTranslation(translationModule.language) + "** ",
		Math.round(getItemValue(potion) * 0.7),
		translationModule.get("potion.info"),
		async(message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			entity.Player.Inventory.giveObject(potion.id, ITEMTYPE.POTION);
			entity.Player.Inventory.save();
			await message.sentMessage.channel.send(
				new DraftBotEmbed()
					.formatAuthor(translationModule.get("potion.give"), message.user)
					.setDescription(potion.toString(translationModule.language))
			);
			return true;
		}
	);
}

module.exports = {
	commands: [
		{
			name: "shop",
			func: ShopCommand,
			aliases: ["s"]
		}
	]
};
