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
import {DraftBotReactionMessage, DraftBotReactionMessageBuilder} from "../../core/messages/DraftBotReactionMessage";
import {DraftBotReaction} from "../../core/messages/DraftBotReaction";
import {format} from "../../core/utils/StringFormatter";
import {Potions} from "../../core/database/game/models/Potion";
import {Entities, Entity} from "../../core/database/game/models/Entity";

import {Maps} from "../../core/Maps";
import Shop from "../../core/database/game/models/Shop";
import {MissionsController} from "../../core/missions/MissionsController";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {sendErrorMessage} from "../../core/utils/ErrorUtils";
import {CommandInteraction, TextBasedChannel, User} from "discord.js";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {NumberChangeReason, ShopItemType} from "../../core/database/logs/LogsDatabase";
import {draftBotInstance} from "../../core/bot";
import {EffectsConstants} from "../../core/constants/EffectsConstants";

/**
 * Displays the shop
 * @param {CommandInteraction} interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {Entities} entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}

	const shopTranslations = Translations.getModule("commands.shop", language);

	const permanentItemsCategory = new ShopItemCategory(
		[
			getRandomItemShopItem(shopTranslations),
			getHealAlterationShopItem(shopTranslations, interaction),
			getRegenShopItem(shopTranslations),
			getBadgeShopItem(shopTranslations, interaction)
		],
		shopTranslations.get("permanentItem")
	);
	const dailyItemsCategory = new ShopItemCategory(
		[await getDailyPotionShopItem(shopTranslations, interaction.user, interaction.channel)],
		shopTranslations.get("dailyItem")
	);
	const inventoryCategory = new ShopItemCategory(
		[getSlotExtensionShopItem(shopTranslations, entity, interaction)],
		shopTranslations.get("inventoryCategory")
	);

	await (await new DraftBotShopMessageBuilder(
		interaction,
		shopTranslations.get("title"),
		language
	)
		.addCategory(dailyItemsCategory)
		.addCategory(permanentItemsCategory)
		.addCategory(inventoryCategory)
		.endCallback(shopEndCallback)
		.build())
		.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(interaction.user.id, BlockingConstants.REASONS.SHOP, collector));
}

function shopEndCallback(shopMessage: DraftBotShopMessage): void {
	BlockingUtils.unblockPlayer(shopMessage.user.id, BlockingConstants.REASONS.SHOP);
}

function getPermanentItemShopItem(name: string, translationModule: TranslationModule, buyCallback: (message: DraftBotShopMessage, amount: number) => Promise<boolean>): ShopItem {
	return new ShopItem(
		translationModule.get(`permanentItems.${name}.emote`),
		translationModule.get(`permanentItems.${name}.name`),
		parseInt(translationModule.get(`permanentItems.${name}.price`), 10),
		translationModule.get(`permanentItems.${name}.info`),
		buyCallback
	);
}

function getRandomItemShopItem(translationModule: TranslationModule): ShopItem {
	return getPermanentItemShopItem(
		"randomItem",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			await giveRandomItem(message.user, message.sentMessage.channel, message.language, entity);
			draftBotInstance.logsDatabase.logClassicalShopBuyout(message.user.id, ShopItemType.RANDOM_ITEM).then();
			return true;
		});
}

function getHealAlterationShopItem(translationModule: TranslationModule, interaction: CommandInteraction): ShopItem {
	return getPermanentItemShopItem(
		"healAlterations",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			if (entity.Player.currentEffectFinished()) {
				await sendErrorMessage(message.user, interaction, message.language, translationModule.get("error.nothingToHeal"));
				return false;
			}
			if (entity.Player.effect !== EffectsConstants.EMOJI_TEXT.DEAD && entity.Player.effect !== EffectsConstants.EMOJI_TEXT.LOCKED) {
				await Maps.removeEffect(entity.Player, NumberChangeReason.SHOP);
				await entity.Player.save();
			}
			await MissionsController.update(entity, message.sentMessage.channel, translationModule.language, {missionId: "recoverAlteration"});
			await message.sentMessage.channel.send({
				embeds: [new DraftBotEmbed()
					.formatAuthor(translationModule.get("success"), message.user)
					.setDescription(translationModule.get("permanentItems.healAlterations.give"))]
			});
			draftBotInstance.logsDatabase.logClassicalShopBuyout(message.user.id, ShopItemType.ALTERATION_HEAL).then();
			return true;
		}
	);
}

function getRegenShopItem(translationModule: TranslationModule): ShopItem {
	return getPermanentItemShopItem(
		"regen",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			await entity.addHealth(await entity.getMaxHealth() - entity.health, message.sentMessage.channel, translationModule.language, NumberChangeReason.SHOP, {
				shouldPokeMission: true,
				overHealCountsForMission: false
			});
			await entity.save();
			await message.sentMessage.channel.send({
				embeds: [
					new DraftBotEmbed()
						.formatAuthor(translationModule.get("success"), message.user)
						.setDescription(translationModule.get("permanentItems.regen.give"))
				]
			});
			draftBotInstance.logsDatabase.logClassicalShopBuyout(message.user.id, ShopItemType.FULL_REGEN).then();
			return true;
		}
	);
}

function getBadgeShopItem(translationModule: TranslationModule, interaction: CommandInteraction): ShopItem {
	return getPermanentItemShopItem(
		"badge",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			if (entity.Player.hasBadge(Constants.BADGES.RICH_PERSON)) {
				await sendErrorMessage(message.user, interaction, message.language, translationModule.get("error.alreadyHasItem"));
				return false;
			}
			entity.Player.addBadge(Constants.BADGES.RICH_PERSON);
			await entity.Player.save();
			await message.sentMessage.channel.send({
				embeds: [new DraftBotEmbed()
					.formatAuthor(translationModule.get("permanentItems.badge.give"), message.user)
					.setDescription(`${Constants.BADGES.RICH_PERSON} ${translationModule.get("permanentItems.badge.name")}`)
				]
			});
			draftBotInstance.logsDatabase.logClassicalShopBuyout(message.user.id, ShopItemType.BADGE).then();
			return true;
		}
	);
}

async function getDailyPotionShopItem(translationModule: TranslationModule, discordUser: User, channel: TextBasedChannel): Promise<ShopItem> {
	const shopPotion = await Shop.findOne({
		attributes: ["shopPotionId"]
	});
	const potion = await Potions.getById(shopPotion.shopPotionId);

	return new ShopItem(
		potion.getEmote(),
		`${potion.getSimpleName(translationModule.language)} **| ${potion.getRarityTranslation(translationModule.language)} | ${potion.getNatureTranslation(translationModule.language)}** `,
		Math.round(getItemValue(potion) * 0.7),
		translationModule.get("potion.info"),
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			await giveItemToPlayer(entity, potion, translationModule.language, discordUser, channel);
			draftBotInstance.logsDatabase.logClassicalShopBuyout(message.user.id, ShopItemType.DAILY_POTION).then();
			return true;
		}
	);
}

function getSlotExtensionShopItem(translationModule: TranslationModule, entity: Entity, interaction: CommandInteraction): ShopItem {
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
				.endCallback((async (chooseSlotMessage) => {
					const reaction = chooseSlotMessage.getFirstReaction();
					if (!reaction || reaction.emoji.name === Constants.REACTIONS.REFUSE_REACTION) {
						BlockingUtils.unblockPlayer(shopMessage.user.id, BlockingConstants.REASONS.SHOP);
						await sendErrorMessage(
							interaction.user,
							interaction,
							shopMessage.language,
							translationModule.get("error.canceledPurchase")
						);
						return;
					}
					[entity] = await Entities.getOrRegister(shopMessage.user.id);
					for (let i = 0; i < Constants.REACTIONS.ITEM_CATEGORIES.length; ++i) {
						if (reaction.emoji.name === Constants.REACTIONS.ITEM_CATEGORIES[i]) {
							await entity.Player.addMoney(entity, -price, shopMessage.sentMessage.channel, translationModule.language, NumberChangeReason.SHOP);
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
					BlockingUtils.unblockPlayer(shopMessage.user.id, BlockingConstants.REASONS.SHOP);
					draftBotInstance.logsDatabase.logClassicalShopBuyout(shopMessage.user.id, ShopItemType.SLOT_EXTENSION).then();
				}) as (msg: DraftBotReactionMessage) => void);
			let desc = "";
			for (const category of availableCategories) {
				chooseSlot.addReaction(new DraftBotReaction(Constants.REACTIONS.ITEM_CATEGORIES[category]));
				desc += `${Constants.REACTIONS.ITEM_CATEGORIES[category]} ${format(translationModule.getFromArray("slotCategories", category), {
					available: Constants.ITEMS.SLOTS.LIMITS[category] - entity.Player.InventoryInfo.slotLimitForCategory(category),
					limit: Constants.ITEMS.SLOTS.LIMITS[category] - 1
				})}\n`;
			}
			chooseSlot.addReaction(new DraftBotReaction(Constants.REACTIONS.REFUSE_REACTION));
			const chooseSlotBuilt = chooseSlot.build();
			chooseSlotBuilt.formatAuthor(translationModule.get("chooseSlotTitle"), shopMessage.user);
			chooseSlotBuilt.setDescription(`${translationModule.get("chooseSlotIndication")}\n\n${desc}`);
			await chooseSlotBuilt.send(shopMessage.sentMessage.channel, (collector) => BlockingUtils.blockPlayerWithCollector(entity.discordUserId, BlockingConstants.REASONS.SHOP, collector));
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
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD, EffectsConstants.EMOJI_TEXT.LOCKED]
	},
	mainGuildCommand: false
};