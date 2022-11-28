import {TextBasedChannel, User} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {TranslationModule, Translations} from "../Translations";
import {ChoiceItem, DraftBotListChoiceMessage} from "../messages/DraftBotListChoiceMessage";
import {DraftBotValidateReactionMessage} from "../messages/DraftBotValidateReactionMessage";
import {format} from "./StringFormatter";
import {Armors} from "../database/game/models/Armor";
import {Weapons} from "../database/game/models/Weapon";
import Potion, {Potions} from "../database/game/models/Potion";
import {ObjectItems} from "../database/game/models/ObjectItem";
import InventorySlot, {InventorySlots} from "../database/game/models/InventorySlot";
import {MissionsController} from "../missions/MissionsController";
import {GenericItemModel} from "../database/game/models/GenericItemModel";
import {BlockingUtils} from "./BlockingUtils";
import {RandomUtils} from "./RandomUtils";
import {BlockingConstants} from "../constants/BlockingConstants";
import {Tags} from "../database/game/models/Tag";
import {NumberChangeReason} from "../constants/LogsConstants";
import {draftBotInstance} from "../bot";
import Player, {Players} from "../database/game/models/Player";
import {InventoryInfos} from "../database/game/models/InventoryInfo";
import {ItemConstants} from "../constants/ItemConstants";

/**
 * Get the value of an item
 * @param item
 */
export const getItemValue = function(item: GenericItemModel): number {
	return Math.round(ItemConstants.RARITY.VALUES[item.rarity] + item.getItemAddedValue());
};

/**
 * Count how many potions the player have
 * @param invSlots
 */
export const countNbOfPotions = function(invSlots: InventorySlot[]): number {
	return invSlots.filter(slot => slot.isPotion() && slot.itemId !== 0).length;
};

/**
 * Check the missions of the player corresponding to a drink of a given potion
 * @param channel
 * @param language
 * @param player
 * @param potion
 * @param inventorySlots
 */
export const checkDrinkPotionMissions = async function(channel: TextBasedChannel, language: string, player: Player, potion: Potion, inventorySlots: InventorySlot[]): Promise<void> {
	await MissionsController.update(player, channel, language, {missionId: "drinkPotion"});
	await MissionsController.update(player, channel, language, {
		missionId: "drinkPotionRarity",
		params: {rarity: potion.rarity}
	});
	const tagsToVerify = await Tags.findTagsFromObject(potion.id, Potion.name);
	if (tagsToVerify) {
		for (let i = 0; i < tagsToVerify.length; i++) {
			await MissionsController.update(player, channel, language, {
				missionId: tagsToVerify[i].textTag,
				params: {tags: tagsToVerify}
			});
		}
	}
	if (potion.nature === ItemConstants.NATURE.NONE) {
		await MissionsController.update(player, channel, language, {missionId: "drinkPotionWithoutEffect"});
	}
	await MissionsController.update(player, channel, language, {
		missionId: "havePotions",
		count: countNbOfPotions(inventorySlots),
		set: true
	});
};

/**
 * Sells or keep the item depending on the parameters
 * @param player
 * @param keepOriginal
 * @param discordUser
 * @param channel
 * @param language
 * @param item
 * @param itemToReplace
 * @param itemToReplaceInstance
 * @param resaleMultiplier
 * @param resaleMultiplierActual
 * @param autoSell
 * @param inventorySlots
 */
// eslint-disable-next-line max-params
const sellOrKeepItem = async function(
	player: Player,
	keepOriginal: boolean,
	discordUser: User,
	channel: TextBasedChannel,
	language: string,
	item: GenericItemModel,
	itemToReplace: InventorySlot,
	itemToReplaceInstance: GenericItemModel,
	resaleMultiplier: number,
	resaleMultiplierActual: number,
	autoSell: boolean,
	inventorySlots: InventorySlot[]
): Promise<void> {
	const tr = Translations.getModule("commands.inventory", language);
	player = await Players.getById(player.id);
	if (!keepOriginal) {
		const menuEmbed = new DraftBotEmbed();
		menuEmbed.formatAuthor(tr.get("acceptedTitle"), discordUser)
			.setDescription(item.toString(language, null));
		await InventorySlot.update(
			{
				itemId: item.id
			},
			{
				where: {
					slot: itemToReplace.slot,
					itemCategory: itemToReplace.itemCategory,
					playerId: player.id
				}
			});
		await MissionsController.update(player, channel, language, {
			missionId: "haveItemRarity",
			params: {rarity: item.rarity}
		});
		draftBotInstance.logsDatabase.logItemGain(player.discordUserId, item).then();
		await channel.send({embeds: [menuEmbed]});
		item = itemToReplaceInstance;
		resaleMultiplier = resaleMultiplierActual;
	}
	const trSell = Translations.getModule("commands.sell", language);
	if (item.getCategory() === ItemConstants.CATEGORIES.POTION) {
		await MissionsController.update(player, channel, language, {missionId: "findOrBuyItem"});
		await channel.send(
			{
				embeds: [
					new DraftBotEmbed()
						.formatAuthor(trSell.get(autoSell ? "soldMessageAlreadyOwnTitle" : "potionDestroyedTitle"), discordUser)
						.setDescription(
							format(trSell.get("potionDestroyedMessage"),
								{
									item: item.getName(language),
									frenchMasculine: item.frenchMasculine
								}
							)
						)]
			}
		);
		return;
	}
	const money = Math.round(getItemValue(item) * resaleMultiplier);
	await player.addMoney({
		amount: money,
		channel,
		language,
		reason: NumberChangeReason.ITEM_SELL
	});
	await MissionsController.update(player, channel, language, {
		missionId: "sellItemWithGivenCost",
		params: {itemCost: money}
	});
	await player.save();
	draftBotInstance.logsDatabase.logItemSell(player.discordUserId, item).then();
	await channel.send({
		embeds: [
			new DraftBotEmbed()
				.formatAuthor(trSell.get(autoSell ? "soldMessageAlreadyOwnTitle" : "soldMessageTitle"), discordUser)
				.setDescription(
					format(trSell.get("soldMessage"),
						{
							item: item.getName(language),
							money: money
						}
					)
				)
		]
	});
	await MissionsController.update(player, channel, language, {missionId: "findOrBuyItem"});
	[player] = await Players.getOrRegister(player.discordUserId);
	await MissionsController.update(player, channel, language, {
		missionId: "havePotions",
		count: countNbOfPotions(inventorySlots),
		set: true
	});
};

/**
 * Manage more than 2 item to choose to keep in the inventory
 * @param items
 * @param discordUser
 * @param player
 * @param channel
 * @param item
 * @param resaleMultiplier
 * @param resaleMultiplierActual
 * @param tr
 * @param inventorySlots
 */
// eslint-disable-next-line max-params
async function manageMoreThan2ItemsSwitching(
	items: InventorySlot[],
	discordUser: User,
	player: Player,
	channel: TextBasedChannel,
	item: GenericItemModel,
	resaleMultiplier: number,
	resaleMultiplierActual: number,
	tr: TranslationModule,
	inventorySlots: InventorySlot[]
): Promise<void> {
	const choiceList: ChoiceItem[] = [];
	// eslint-disable-next-line @typescript-eslint/no-extra-parens
	items.sort((a: InventorySlot, b: InventorySlot) => (a.slot > b.slot ? 1 : b.slot > a.slot ? -1 : 0));
	for (const inventorySlot of items) {
		choiceList.push(new ChoiceItem(
			(await inventorySlot.getItem()).toString(tr.language, null),
			inventorySlot
		));
	}
	const choiceMessage = new DraftBotListChoiceMessage(
		choiceList,
		discordUser.id,
		async (replacedItem: InventorySlot) => {
			[player] = await Players.getOrRegister(player.discordUserId);
			BlockingUtils.unblockPlayer(discordUser.id, BlockingConstants.REASONS.ACCEPT_ITEM);
			await sellOrKeepItem(
				player,
				false,
				discordUser,
				channel,
				tr.language,
				item,
				replacedItem,
				await replacedItem.getItem(),
				resaleMultiplier,
				resaleMultiplierActual,
				false,
				inventorySlots
			);
		},
		async (endMessage: DraftBotListChoiceMessage) => {
			if (endMessage.isCanceled()) {
				BlockingUtils.unblockPlayer(discordUser.id, BlockingConstants.REASONS.ACCEPT_ITEM);
				await sellOrKeepItem(
					player,
					true,
					discordUser,
					channel,
					tr.language,
					item,
					null,
					null,
					resaleMultiplier,
					resaleMultiplierActual,
					false,
					inventorySlots
				);
			}
		}
	);
	choiceMessage.formatAuthor(
		tr.get("chooseItemToReplaceTitle"),
		discordUser
	);
	await choiceMessage.send(channel, (collector) => BlockingUtils.blockPlayerWithCollector(discordUser.id, BlockingConstants.REASONS.ACCEPT_ITEM, collector));
}

/**
 * Gives an item to a player
 * @param player
 * @param item
 * @param language
 * @param discordUser
 * @param channel
 * @param inventorySlots
 * @param resaleMultiplierNew
 * @param resaleMultiplierActual
 */
// eslint-disable-next-line max-params
export const giveItemToPlayer = async function(
	player: Player,
	item: GenericItemModel,
	language: string,
	discordUser: User,
	channel: TextBasedChannel,
	inventorySlots: InventorySlot[],
	resaleMultiplierNew = 1,
	resaleMultiplierActual = 1
): Promise<void> {
	const resaleMultiplier = resaleMultiplierNew;
	const tr = Translations.getModule("commands.inventory", language);
	await channel.send({
		embeds: [
			new DraftBotEmbed()
				.formatAuthor(tr.get("randomItemTitle"), discordUser)
				.setDescription(item.toString(language, null))
		]
	});

	if (await player.giveItem(item) === true) {
		await MissionsController.update(player, channel, language, {missionId: "findOrBuyItem"});
		await MissionsController.update(player, channel, language, {
			missionId: "havePotions",
			count: countNbOfPotions(inventorySlots),
			set: true
		});
		await MissionsController.update(player, channel, language, {
			missionId: "haveItemRarity",
			params: {rarity: item.rarity}
		});
		draftBotInstance.logsDatabase.logItemGain(player.discordUserId, item).then();
		return;
	}

	const category = item.getCategory();
	const maxSlots = (await InventoryInfos.getOfPlayer(player.id)).slotLimitForCategory(category);
	let itemToReplace: InventorySlot;
	let autoSell = false;
	if (maxSlots < 3) {
		itemToReplace = inventorySlots.filter((slot: InventorySlot) => (maxSlots === 1 ? slot.isEquipped() : slot.slot === 1) && slot.itemCategory === category)[0];
		autoSell = itemToReplace.itemId === item.id;
	}
	else {
		const items = inventorySlots.filter((slot: InventorySlot) => slot.itemCategory === category && !slot.isEquipped());
		if (items.length === items.filter((slot: InventorySlot) => slot.itemId === item.id).length) {
			autoSell = true;
		}
		else {
			await manageMoreThan2ItemsSwitching(items, discordUser, player, channel, item, resaleMultiplier, resaleMultiplierActual, tr, inventorySlots);
			return;
		}
	}
	if (autoSell) {
		await sellOrKeepItem(
			player,
			true,
			discordUser,
			channel,
			language,
			item,
			null,
			null,
			resaleMultiplier,
			resaleMultiplierActual,
			true,
			inventorySlots
		);
		return;
	}

	const itemToReplaceInstance = await itemToReplace.getItem();
	await new DraftBotValidateReactionMessage(
		discordUser,
		async (msg: DraftBotValidateReactionMessage) => {
			[player] = await Players.getOrRegister(player.discordUserId);
			BlockingUtils.unblockPlayer(discordUser.id, BlockingConstants.REASONS.ACCEPT_ITEM);
			await sellOrKeepItem(
				player,
				!msg.isValidated(),
				discordUser,
				channel,
				language,
				item,
				itemToReplace,
				itemToReplaceInstance,
				resaleMultiplier,
				resaleMultiplierActual,
				false,
				inventorySlots
			);
		}
	)
		.formatAuthor(tr.get(item.getCategory() === ItemConstants.CATEGORIES.POTION ? "randomItemFooterPotion" : "randomItemFooter"), discordUser)
		.setDescription(tr.format("randomItemDesc", {
			actualItem: itemToReplaceInstance.toString(language, null)
		}))
		.send(channel, (collector) => BlockingUtils.blockPlayerWithCollector(discordUser.id, BlockingConstants.REASONS.ACCEPT_ITEM, collector));
};

/**
 * Generate a random rarity. Legendary is very rare and common is not rare at all
 * @param {number} minRarity
 * @param {number} maxRarity
 * @return {Number} generated rarity
 */
export const generateRandomRarity = function(minRarity = ItemConstants.RARITY.COMMON, maxRarity = ItemConstants.RARITY.MYTHICAL): number {
	const randomValue = RandomUtils.draftbotRandom.integer(
		1 + (minRarity === ItemConstants.RARITY.COMMON ? -1 : ItemConstants.RARITY.GENERATOR.VALUES[minRarity - 2]),
		ItemConstants.RARITY.GENERATOR.MAX_VALUE
		- (maxRarity === ItemConstants.RARITY.MYTHICAL ? 0 : ItemConstants.RARITY.GENERATOR.MAX_VALUE
			- ItemConstants.RARITY.GENERATOR.VALUES[maxRarity - 1])
	);
	let rarity = ItemConstants.RARITY.BASIC;
	do {
		rarity++; // we increase rarity until we find the generated one
	} while (randomValue > ItemConstants.RARITY.GENERATOR.VALUES[rarity - 1]);
	return rarity;
};

/**
 * Generate a random itemType
 * @return {Number}
 */
export const generateRandomItemCategory = function(): number {
	return RandomUtils.draftbotRandom.pick(Object.values(ItemConstants.CATEGORIES));
};

/**
 * Generates a random item given its category and the rarity limits
 * @param itemCategory
 * @param minRarity
 * @param maxRarity
 * @param itemSubType
 */
export const generateRandomItem = async function(
	itemCategory: number = null,
	minRarity: number = ItemConstants.RARITY.COMMON,
	maxRarity: number = ItemConstants.RARITY.MYTHICAL,
	itemSubType: number = null
): Promise<GenericItemModel> {
	const rarity = generateRandomRarity(minRarity, maxRarity);
	const category = itemCategory ?? generateRandomItemCategory();
	let itemsIds;
	switch (category) {
	case ItemConstants.CATEGORIES.WEAPON:
		itemsIds = await Weapons.getAllIdsForRarity(rarity);
		return await Weapons.getById(itemsIds[RandomUtils.draftbotRandom.integer(0, itemsIds.length - 1)].id);
	case ItemConstants.CATEGORIES.ARMOR:
		itemsIds = await Armors.getAllIdsForRarity(rarity);
		return await Armors.getById(itemsIds[RandomUtils.draftbotRandom.integer(0, itemsIds.length - 1)].id);
	case ItemConstants.CATEGORIES.POTION:
		if (itemSubType) {
			return await Potions.randomItem(itemSubType, rarity);
		}
		itemsIds = await Potions.getAllIdsForRarity(rarity);
		return await Potions.getById(itemsIds[RandomUtils.draftbotRandom.integer(0, itemsIds.length - 1)].id);
	default:
		// This will be triggered by ItemConstants.CATEGORIES.OBJECT
		if (itemSubType) {
			return await ObjectItems.randomItem(itemSubType, rarity);
		}
		itemsIds = await ObjectItems.getAllIdsForRarity(rarity);
		return await ObjectItems.getById(itemsIds[RandomUtils.draftbotRandom.integer(0, itemsIds.length - 1)].id);
	}
};

/**
 * give a random item
 * @param {User} discordUser
 * @param {TextBasedChannel} channel
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {Player} player
 */
export const giveRandomItem = async function(discordUser: User, channel: TextBasedChannel, language: string, player: Player): Promise<void> {
	await giveItemToPlayer(player, await generateRandomItem(), language, discordUser, channel, await InventorySlots.getOfPlayer(player.id));
};

type TemporarySlotAndItemType = { slot: InventorySlot, item: GenericItemModel };

/**
 * Sort an item slots list by type then price
 * @param items
 */
export const sortPlayerItemList = async function(items: InventorySlot[]): Promise<InventorySlot[]> {
	let itemInstances: TemporarySlotAndItemType[] = await Promise.all(items.map(async function(invSlot) {
		return {
			slot: invSlot,
			item: await invSlot.getItem()
		};
	}));
	itemInstances = itemInstances.sort(
		(a: TemporarySlotAndItemType, b: TemporarySlotAndItemType) => {
			if (a.slot.itemCategory < b.slot.itemCategory) {
				return -1;
			}
			if (a.slot.itemCategory > b.slot.itemCategory) {
				return 1;
			}
			const aValue = getItemValue(a.item);
			const bValue = getItemValue(b.item);
			return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
		}
	);
	return itemInstances.map(function(e) {
		return e.slot;
	});
};

/**
 * Checks if the given inventory slots have an item with a rarity of at least the given rarity
 * @param slots
 * @param rarity
 */
export const haveRarityOrMore = async function(slots: InventorySlot[], rarity: number): Promise<boolean> {
	for (const slot of slots) {
		if ((await slot.getItem()).rarity >= rarity) {
			return true;
		}
	}
	return false;
};

/**
 * Get a portion of the model corresponding to the category number
 * @param category
 */
function getCategoryModelByName(category: number): { getMaxId: () => Promise<number>, getById: (itemId: number) => Promise<GenericItemModel> } {
	switch (category) {
	case ItemConstants.CATEGORIES.WEAPON:
		return Weapons;
	case ItemConstants.CATEGORIES.ARMOR:
		return Armors;
	case ItemConstants.CATEGORIES.POTION:
		return Potions;
	case ItemConstants.CATEGORIES.OBJECT:
		return ObjectItems;
	default:
		return null;
	}
}

/**
 * Get an item by its id and its category number
 * @param itemId
 * @param category
 */
export async function getItemByIdAndCategory(itemId: number, category: number): Promise<GenericItemModel> {
	const categoryModel = getCategoryModelByName(category);
	if (!categoryModel) {
		return null;
	}
	return itemId <= await categoryModel.getMaxId() && itemId > 0 ? await categoryModel.getById(itemId) : null;
}