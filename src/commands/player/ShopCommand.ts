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
import Shop from "../../core/database/game/models/Shop";
import {MissionsController} from "../../core/missions/MissionsController";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {sendErrorMessage} from "../../core/utils/ErrorUtils";
import {CommandInteraction} from "discord.js";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {draftBotInstance} from "../../core/bot";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {TravelTime} from "../../core/maps/TravelTime";
import {Player, Players} from "../../core/database/game/models/Player";
import {InventoryInfo, InventoryInfos} from "../../core/database/game/models/InventoryInfo";
import {InventorySlots} from "../../core/database/game/models/InventorySlot";
import {NumberChangeReason, ShopItemType} from "../../core/constants/LogsConstants";
import {LogsReadRequests} from "../../core/database/logs/LogsReadRequests";

/**
 * Callback of the shop command
 * @param shopMessage
 */
function shopEndCallback(shopMessage: DraftBotShopMessage): void {
	BlockingUtils.unblockPlayer(shopMessage.user.id, BlockingConstants.REASONS.SHOP);
}

/**
 * Get the structure of a permanent shop item
 * @param name
 * @param translationModule
 * @param buyCallback
 */
function getPermanentItemShopItem(name: string, translationModule: TranslationModule, buyCallback: (message: DraftBotShopMessage, amount: number) => Promise<boolean>): ShopItem {
	return new ShopItem(
		translationModule.get(`permanentItems.${name}.emote`),
		translationModule.get(`permanentItems.${name}.name`),
		parseInt(translationModule.get(`permanentItems.${name}.price`), 10),
		translationModule.get(`permanentItems.${name}.info`),
		buyCallback
	);
}

/*
 * Get the shop item for getting a random item
 * @param translationModule
 */
function getRandomItemShopItem(translationModule: TranslationModule): ShopItem {
	return getPermanentItemShopItem(
		"randomItem",
		translationModule,
		async (message) => {
			const [player] = await Players.getOrRegister(message.user.id);
			await giveRandomItem(message.user, message.sentMessage.channel, message.language, player);
			draftBotInstance.logsDatabase.logClassicalShopBuyout(message.user.id, ShopItemType.RANDOM_ITEM).then();
			return true;
		});
}

/**
 * Get the shop item for healing from an alteration
 * @param translationModule
 * @param interaction
 */
function getHealAlterationShopItem(translationModule: TranslationModule, interaction: CommandInteraction): ShopItem {
	return getPermanentItemShopItem(
		"healAlterations",
		translationModule,
		async (message) => {
			const [player] = await Players.getOrRegister(message.user.id);
			if (player.currentEffectFinished(interaction.createdAt)) {
				await sendErrorMessage(message.user, interaction, message.language, translationModule.get("error.nothingToHeal"));
				return false;
			}
			if (player.effect !== EffectsConstants.EMOJI_TEXT.DEAD && player.effect !== EffectsConstants.EMOJI_TEXT.LOCKED) {
				await TravelTime.removeEffect(player, NumberChangeReason.SHOP);
				await player.save();
			}
			await MissionsController.update(player, message.sentMessage.channel, translationModule.language, {missionId: "recoverAlteration"});
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

/**
 * Get the shop item for regenerating to full life
 * @param translationModule
 */
function getRegenShopItem(translationModule: TranslationModule): ShopItem {
	return getPermanentItemShopItem(
		"regen",
		translationModule,
		async (message) => {
			const [player] = await Players.getOrRegister(message.user.id);
			await player.addHealth(await player.getMaxHealth() - player.health, message.sentMessage.channel, translationModule.language, NumberChangeReason.SHOP, {
				shouldPokeMission: true,
				overHealCountsForMission: false
			});
			await player.save();
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

/**
 * Get the shop item for the money mouth badge
 * @param translationModule
 * @param interaction
 */
function getBadgeShopItem(translationModule: TranslationModule, interaction: CommandInteraction): ShopItem {
	return getPermanentItemShopItem(
		"badge",
		translationModule,
		async (message) => {
			const [player] = await Players.getOrRegister(message.user.id);
			if (player.hasBadge(Constants.BADGES.RICH_PERSON)) {
				await sendErrorMessage(message.user, interaction, message.language, translationModule.get("error.alreadyHasItem"));
				return false;
			}
			player.addBadge(Constants.BADGES.RICH_PERSON);
			await player.save();
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

/**
 * Get the shop item for getting the daily potion
 * @param translationModule
 * @param interaction
 */
async function getDailyPotionShopItem(translationModule: TranslationModule, interaction: CommandInteraction): Promise<ShopItem> {
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
			const [player] = await Players.getOrRegister(message.user.id);
			const potionAlreadyPurchased = await LogsReadRequests.getAmountOfDailyPotionsBoughtByPlayer(player.discordUserId);
			if (potionAlreadyPurchased >= Constants.MAX_DAILY_POTION_BUYOUTS) {
				await sendErrorMessage(interaction.user, interaction, message.language, translationModule.get("error.noMoreDailyPotions"));
				return false;
			}
			await giveItemToPlayer(player, potion, translationModule.language, interaction.user, interaction.channel, await InventorySlots.getOfPlayer(player.id));
			draftBotInstance.logsDatabase.logClassicalShopBuyout(message.user.id, ShopItemType.DAILY_POTION).then();
			return true;
		}
	);
}

type ItemInformation = { price: number, availableCategories: number[] }
type PlayerInformation = { player: Player, invInfo: InventoryInfo }

function getBuySlotExtensionShopItemCallback(
	interaction: CommandInteraction,
	translationModule: TranslationModule,
	itemInformation: ItemInformation,
	playerInformation: PlayerInformation
) {
	return async (shopMessage: DraftBotShopMessage): Promise<boolean> => {
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
				[playerInformation.player] = await Players.getOrRegister(shopMessage.user.id);
				for (let i = 0; i < Constants.REACTIONS.ITEM_CATEGORIES.length; ++i) {
					if (reaction.emoji.name === Constants.REACTIONS.ITEM_CATEGORIES[i]) {
						await playerInformation.player.addMoney({
							amount: -itemInformation.price,
							channel: shopMessage.sentMessage.channel,
							language: translationModule.language,
							reason: NumberChangeReason.SHOP
						});
						await playerInformation.player.save();
						playerInformation.invInfo.addSlotForCategory(i);
						await playerInformation.invInfo.save();
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
		for (const category of itemInformation.availableCategories) {
			chooseSlot.addReaction(new DraftBotReaction(Constants.REACTIONS.ITEM_CATEGORIES[category]));
			desc += `${Constants.REACTIONS.ITEM_CATEGORIES[category]} ${format(translationModule.getFromArray("slotCategories", category), {
				available: Constants.ITEMS.SLOTS.LIMITS[category] - playerInformation.invInfo.slotLimitForCategory(category),
				limit: Constants.ITEMS.SLOTS.LIMITS[category] - 1
			})}\n`;
		}
		chooseSlot.addReaction(new DraftBotReaction(Constants.REACTIONS.REFUSE_REACTION));
		const chooseSlotBuilt = chooseSlot.build();
		chooseSlotBuilt.formatAuthor(translationModule.get("chooseSlotTitle"), shopMessage.user);
		chooseSlotBuilt.setDescription(`${translationModule.get("chooseSlotIndication")}\n\n${desc}`);
		await chooseSlotBuilt.send(
			shopMessage.sentMessage.channel,
			(collector) => BlockingUtils.blockPlayerWithCollector(playerInformation.player.discordUserId, BlockingConstants.REASONS.SHOP,
				collector));
		return Promise.resolve(false);
	};
}

/**
 * Get the shop item for extending your inventory
 * @param translationModule
 * @param player
 * @param interaction
 */
async function getSlotExtensionShopItem(translationModule: TranslationModule, player: Player, interaction: CommandInteraction): Promise<ShopItem> {
	const invInfo = await InventoryInfos.getOfPlayer(player.id);
	const availableCategories = [0, 1, 2, 3]
		.filter(itemCategory => invInfo.slotLimitForCategory(itemCategory) < Constants.ITEMS.SLOTS.LIMITS[itemCategory]);
	if (availableCategories.length === 0) {
		return null;
	}
	const totalSlots = invInfo.weaponSlots + invInfo.armorSlots
		+ invInfo.potionSlots + invInfo.objectSlots;
	const price = Constants.ITEMS.SLOTS.PRICES[totalSlots - 4];
	if (!price) {
		return null;
	}
	return new ShopItem(
		Constants.REACTIONS.INVENTORY_EXTENSION,
		translationModule.get("slotsExtension"),
		price,
		translationModule.get("slotsExtensionInfo"),
		getBuySlotExtensionShopItemCallback(interaction, translationModule, {price, availableCategories}, {
			player,
			invInfo
		})
	);
}

/**
 * Displays the shop
 * @param {CommandInteraction} interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {Player} player
 */
async function executeCommand(interaction: CommandInteraction, language: string, player: Player): Promise<void> {
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
		[await getDailyPotionShopItem(shopTranslations, interaction)],
		shopTranslations.format("dailyItem",{
			available: Constants.MAX_DAILY_POTION_BUYOUTS - await LogsReadRequests.getAmountOfDailyPotionsBoughtByPlayer(player.discordUserId)
		})
	);
	const inventoryCategory = new ShopItemCategory(
		[await getSlotExtensionShopItem(shopTranslations, player, interaction)],
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

const currentCommandFrenchTranslations = Translations.getModule("commands.shop", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.shop", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations),
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD, EffectsConstants.EMOJI_TEXT.LOCKED]
	},
	mainGuildCommand: false
};