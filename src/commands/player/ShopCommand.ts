import {
	DraftBotShopMessage,
	DraftBotShopMessageBuilder,
	ShopItem,
	ShopItemCategory
} from "../../core/messages/DraftBotShopMessage";
import {TranslationModule, Translations} from "../../core/Translations";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {getItemValue, giveItemToPlayer, giveRandomItem} from "../../core/utils/ItemUtils";
import {Constants} from "../../core/Constants";
import {DraftBotReactionMessageBuilder} from "../../core/messages/DraftBotReactionMessage";
import {DraftBotErrorEmbed} from "../../core/messages/DraftBotErrorEmbed";
import {DraftBotReaction} from "../../core/messages/DraftBotReaction";
import {format} from "../../core/utils/StringFormatter";
import {Potions} from "../../core/models/Potion";
import {Entities, Entity} from "../../core/models/Entity";

import {Maps} from "../../core/Maps";
import Shop from "../../core/models/Shop";
import {MissionsController} from "../../core/missions/MissionsController";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, TextChannel, User} from "discord.js";

declare function sendBlockedError(user: User, channel: TextChannel, language: string): Promise<boolean>;

declare function sendErrorMessage(user: User, channel: TextChannel, language: string, reason: string, isCancelling?: boolean): Promise<void>;

/**
 * Displays the shop
 * @param {CommandInteraction} interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {Entities} entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity) {
	if (await sendBlockedError(interaction.user, <TextChannel>interaction.channel, language)) {
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
		[await getDailyPotionShopItem(shopTranslations, interaction.user, <TextChannel>interaction.channel)],
		shopTranslations.get("dailyItem")
	);
	const inventoryCategory = new ShopItemCategory(
		[getSlotExtensionShopItem(shopTranslations, entity)],
		shopTranslations.get("inventoryCategory")
	);

	await (await new DraftBotShopMessageBuilder(
		interaction.user,
		shopTranslations.get("title"),
		language
	)
		.addCategory(dailyItemsCategory)
		.addCategory(permanentItemsCategory)
		.addCategory(inventoryCategory)
		.endCallback(shopEndCallback)
		.build())
		.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(interaction.user.id, "shop", collector));
}

function shopEndCallback(shopMessage: DraftBotShopMessage) {
	BlockingUtils.unblockPlayer(shopMessage.user.id);
}

function getPermanentItemShopItem(name: string, translationModule: TranslationModule, buyCallback: (message: DraftBotShopMessage, amount: number) => Promise<boolean>) {
	return new ShopItem(
		translationModule.get("permanentItems." + name + ".emote"),
		translationModule.get("permanentItems." + name + ".name"),
		parseInt(translationModule.get("permanentItems." + name + ".price")),
		translationModule.get("permanentItems." + name + ".info"),
		buyCallback
	);
}

function getRandomItemShopItem(translationModule: TranslationModule) {
	return getPermanentItemShopItem(
		"randomItem",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			await giveRandomItem(message.user, <TextChannel>message.sentMessage.channel, message.language, entity);
			return true;
		});
}

function getHealAlterationShopItem(translationModule: TranslationModule) {
	return getPermanentItemShopItem(
		"healAlterations",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			if (entity.Player.currentEffectFinished()) {
				await sendErrorMessage(message.user, <TextChannel>message.sentMessage.channel, message.language, translationModule.get("error.nothingToHeal"));
				return false;
			}
			if (entity.Player.effect !== Constants.EFFECT.DEAD && entity.Player.effect !== Constants.EFFECT.LOCKED) {
				await Maps.removeEffect(entity.Player);
				await entity.Player.save();
			}
			await MissionsController.update(entity.discordUserId, <TextChannel>message.sentMessage.channel, translationModule.language, "recoverAlteration");
			await message.sentMessage.channel.send({
				embeds: [new DraftBotEmbed()
					.formatAuthor(translationModule.get("success"), message.user)
					.setDescription(translationModule.get("permanentItems.healAlterations.give"))]
			});
			return true;
		}
	);
}

function getRegenShopItem(translationModule: TranslationModule) {
	return getPermanentItemShopItem(
		"regen",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			await entity.setHealth(await entity.getMaxHealth(), <TextChannel>message.sentMessage.channel, translationModule.language);
			await entity.save();
			await message.sentMessage.channel.send({embeds: [
				new DraftBotEmbed()
					.formatAuthor(translationModule.get("success"), message.user)
					.setDescription(translationModule.get("permanentItems.regen.give"))
			] });
			return true;
		}
	);
}

function getBadgeShopItem(translationModule: TranslationModule) {
	return getPermanentItemShopItem(
		"badge",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			if (entity.Player.hasBadge(Constants.BADGES.RICH_PERSON)) {
				await sendErrorMessage(message.user, <TextChannel>message.sentMessage.channel, message.language, translationModule.get("error.alreadyHasItem"));
				return false;
			}
			entity.Player.addBadge(Constants.BADGES.RICH_PERSON);
			await entity.Player.save();
			await message.sentMessage.channel.send({ embeds: [new DraftBotEmbed()
				.formatAuthor(translationModule.get("permanentItems.badge.give"), message.user)
				.setDescription(Constants.BADGES.RICH_PERSON + " " + translationModule.get("permanentItems.badge.name"))
			] });
			return true;
		}
	);
}

async function getDailyPotionShopItem(translationModule: TranslationModule, discordUser: User, channel: TextChannel) {
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

function getSlotExtensionShopItem(translationModule: TranslationModule, entity: Entity) {
	const availableCategories = [0, 1, 2, 3]
		.filter(itemCategory => entity.Player.InventoryInfo.slotLimitForCategory(itemCategory) < Constants.ITEMS.SLOTS.LIMITS[itemCategory]);
	if (availableCategories.length === 0) {
		return null;
	}
	const totalSlots = entity.Player.InventoryInfo.weaponSlots
		+ entity.Player.InventoryInfo.armorSlots
		+ entity.Player.InventoryInfo.potionSlots
		+ entity.Player.InventoryInfo.objectSlots;
	const price = Constants.ITEMS.SLOTS.PRICES[totalSlots - 4];
	if (!price) {
		return null;
	}
	return new ShopItem(
		Constants.REACTIONS.INVENTORY_EXTENSION,
		translationModule.get("slotsExtension"),
		price,
		translationModule.get("slotsExtensionInfo"),
		async (shopMessage) => {
			const chooseSlot: DraftBotReactionMessageBuilder = new DraftBotReactionMessageBuilder()
				.allowUser(shopMessage.user)
				.endCallback(async (chooseSlotMessage) => {
					const reaction = chooseSlotMessage.getFirstReaction();
					if (!reaction || reaction.emoji.name === Constants.REACTIONS.REFUSE_REACTION) {
						BlockingUtils.unblockPlayer(shopMessage.user.id);
						await shopMessage.sentMessage.channel.send({
							embeds: [new DraftBotErrorEmbed(
								shopMessage.user,
								shopMessage.language,
								translationModule.get("error.canceledPurchase")
							)]
						});
						return;
					}
					[entity] = await Entities.getOrRegister(shopMessage.user.id);
					for (let i = 0; i < Constants.REACTIONS.ITEM_CATEGORIES.length; ++i) {
						if (reaction.emoji.name === Constants.REACTIONS.ITEM_CATEGORIES[i]) {
							await entity.Player.addMoney(entity, -price, <TextChannel>shopMessage.sentMessage.channel, translationModule.language);
							await entity.Player.save();
							entity.Player.InventoryInfo.addSlotForCategory(i);
							await entity.Player.InventoryInfo.save();
							await shopMessage.sentMessage.channel.send({
								embeds: [
									new DraftBotEmbed()
										.formatAuthor(translationModule.get("success"), shopMessage.user)
										.setDescription(translationModule.get("slotGive"))
								]
							});
							break;
						}
					}
					BlockingUtils.unblockPlayer(shopMessage.user.id);
				});
			let desc = "";
			for (const category of availableCategories) {
				chooseSlot.addReaction(new DraftBotReaction(Constants.REACTIONS.ITEM_CATEGORIES[category]));
				desc += Constants.REACTIONS.ITEM_CATEGORIES[category] + " " + format(translationModule.getFromArray("slotCategories", category), {
					available: Constants.ITEMS.SLOTS.LIMITS[category] - entity.Player.InventoryInfo.slotLimitForCategory(category),
					limit: Constants.ITEMS.SLOTS.LIMITS[category] - 1
				}) + "\n";
			}
			chooseSlot.addReaction(new DraftBotReaction(Constants.REACTIONS.REFUSE_REACTION));
			const chooseSlotBuilt = chooseSlot.build();
			chooseSlotBuilt.formatAuthor(translationModule.get("chooseSlotTitle"), shopMessage.user);
			chooseSlotBuilt.setDescription(translationModule.get("chooseSlotIndication") + "\n\n" + desc);
			await chooseSlotBuilt.send(shopMessage.sentMessage.channel, (collector) => BlockingUtils.blockPlayerWithCollector(entity.discordUserId, "shop", collector));
			return Promise.resolve(false);
		}
	);
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("shop")
		.setDescription("Shows the main shop in order to buy player related items"),
	executeCommand,
	requirements: {
		allowEffects: null,
		requiredLevel: null,
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD, Constants.EFFECT.LOCKED],
		guildPermissions: null,
		guildRequired: null,
		userPermission: null
	},
	mainGuildCommand: false,
	slashCommandPermissions: null
};
