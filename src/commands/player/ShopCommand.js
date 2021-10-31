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
	name: "shop",
	aliases: ["s"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED]
};

/**
 * Displays the shop
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 */
const ShopCommand = async (message, language) => {
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
		[await getDailyPotionShopItem(shopTranslations, message.author, message.channel)],
		shopTranslations.get("dailyItem")
	);
	const inventoryCategory = new ShopItemCategory(
		[getSlotExtensionShopItem(shopTranslations, entity)],
		shopTranslations.get("inventoryCategory")
	);

	const shopMessage = (await new DraftBotShopMessageBuilder(
		message.author,
		shopTranslations.get("title"),
		language
	)
		.addCategory(dailyItemsCategory)
		.addCategory(permanentItemsCategory)
		.addCategory(inventoryCategory)
		.endCallback(shopEndCallback)
		.build())
		.send(message.channel);

	addBlockedPlayer(entity.discordUserId, "shop", shopMessage.collector);
};

function shopEndCallback(shopMessage) {
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
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			await giveRandomItem(message.user, message.sentMessage.channel, message.language, entity);
			return true;
		});
}

function getHealAlterationShopItem(translationModule) {
	return getPermanentItemShopItem(
		"healAlterations",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			if (entity.Player.currentEffectFinished()) {
				await sendErrorMessage(message.user, message.sentMessage.channel, message.language, translationModule.get("error.nothingToHeal"));
				return false;
			}
			if (entity.Player.effect !== EFFECT.DEAD && entity.Player.effect !== EFFECT.LOCKED) {
				await Maps.removeEffect(entity.Player);
				await entity.Player.save();
			}
			await message.sentMessage.channel.send({ embeds: [new DraftBotEmbed()
				.formatAuthor(translationModule.get("success"), message.user)
				.setDescription(translationModule.get("permanentItems.healAlterations.give"))] });
			return true;
		}
	);
}

function getRegenShopItem(translationModule) {
	return getPermanentItemShopItem(
		"regen",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			await entity.setHealth(await entity.getMaxHealth());
			await entity.save();
			await message.sentMessage.channel.send({ embeds: [
				new DraftBotEmbed()
					.formatAuthor(translationModule.get("success"), message.user)
					.setDescription(translationModule.get("permanentItems.regen.give"))
			] });
			return true;
		}
	);
}

function getBadgeShopItem(translationModule) {
	return getPermanentItemShopItem(
		"badge",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			if (entity.Player.hasBadge("🤑")) {
				await sendErrorMessage(message.user, message.sentMessage.channel, message.language, translationModule.get("error.alreadyHasItem"));
				return false;
			}
			entity.Player.addBadge("🤑");
			await entity.Player.save();
			await message.sentMessage.channel.send({ embeds: [new DraftBotEmbed()
				.formatAuthor(translationModule.get("permanentItems.badge.give"), message.user)
				.setDescription("🤑 " + translationModule.get("permanentItems.badge.name"))
			] });
			return true;
		}
	);
}

async function getDailyPotionShopItem(translationModule, discordUser, channel) {
	const shopPotion = await Shop.findOne({
		attributes: ["shopPotionId"]
	});
	const potion = await Potions.getById(shopPotion.shopPotionId);

	return new ShopItem(
		potion.getEmoji(),
		potion.getSimplePotionName(translationModule.language) + " **| "
		+ potion.getRarityTranslation(translationModule.language) + " | "
		+ potion.getNatureTranslation(translationModule.language) + "** ",
		Math.round(getItemValue(potion) * 0.7),
		translationModule.get("potion.info"),
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			await giveItemToPlayer(entity, potion, translationModule.language, discordUser, channel);
			return true;
		}
	);
}

function getSlotExtensionShopItem(translationModule, entity) {
	const availableCategories = [0, 1, 2, 3].filter(itemCategory => entity.Player.InventoryInfo.slotLimitForCategory(itemCategory) < JsonReader.items.slots.limits[itemCategory]);
	if (availableCategories.length === 0) {
		return null;
	}
	const totalSlots = entity.Player.InventoryInfo.weaponSlots
		+ entity.Player.InventoryInfo.armorSlots
		+ entity.Player.InventoryInfo.potionSlots
		+ entity.Player.InventoryInfo.objectSlots;
	const price = JsonReader.items.slots.prices[totalSlots - 4];
	if (!price) {
		return null;
	}
	return new ShopItem(
		Constants.REACTIONS.INVENTORY_EXTENSION,
		translationModule.get("slotsExtension"),
		price,
		translationModule.get("slotsExtensionInfo"),
		(shopMessage) => {
			let chooseSlot = new DraftBotReactionMessageBuilder()
				.allowUser(shopMessage.user)
				.endCallback(async (chooseSlotMessage) => {
					const reaction = chooseSlotMessage.getFirstReaction();
					if (!reaction || reaction.emoji.name === Constants.REACTIONS.REFUSE_REACTION) {
						removeBlockedPlayer(shopMessage.user.id);
						await shopMessage.sentMessage.channel.send({ embeds: [new DraftBotErrorEmbed(
							shopMessage.user,
							shopMessage.language,
							translationModule.get("error.canceledPurchase")
						)] });
						return;
					}
					[entity] = await Entities.getOrRegister(shopMessage.user.id);
					for (let i = 0; i < Constants.REACTIONS.ITEM_CATEGORIES.length; ++i) {
						if (reaction.emoji.name === Constants.REACTIONS.ITEM_CATEGORIES[i]) {
							entity.Player.addMoney(-price);
							await entity.Player.save();
							entity.Player.InventoryInfo.addSlotForCategory(i);
							await entity.Player.InventoryInfo.save();
							await shopMessage.sentMessage.channel.send({ embeds: [
								new DraftBotEmbed()
									.formatAuthor(translationModule.get("success"), shopMessage.user)
									.setDescription(translationModule.get("slotGive"))
							] });
							break;
						}
					}
					removeBlockedPlayer(shopMessage.user.id);
				});
			let desc = "";
			for (const category of availableCategories) {
				chooseSlot.addReaction(new DraftBotReaction(Constants.REACTIONS.ITEM_CATEGORIES[category]));
				desc += Constants.REACTIONS.ITEM_CATEGORIES[category] + " " + format(translationModule.getFromArray("slotCategories", category), {
					available: JsonReader.items.slots.limits[category] - entity.Player.InventoryInfo.slotLimitForCategory(category),
					limit: JsonReader.items.slots.limits[category] - 1
				}) + "\n";
			}
			chooseSlot.addReaction(new DraftBotReaction(Constants.REACTIONS.REFUSE_REACTION));
			chooseSlot = chooseSlot.build();
			chooseSlot.formatAuthor(translationModule.get("chooseSlotTitle"), shopMessage.user);
			chooseSlot.setDescription(translationModule.get("chooseSlotIndication") + "\n\n" + desc);
			chooseSlot.send(shopMessage.sentMessage.channel);
			addBlockedPlayer(entity.discordUserId, "shop", chooseSlot.collector);
			Promise.resolve(false);
		}
	);
}

module.exports.execute = ShopCommand;
