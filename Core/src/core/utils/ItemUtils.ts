import InventorySlot, { InventorySlots } from "../database/game/models/InventorySlot";
import { MissionsController } from "../missions/MissionsController";
import { RandomUtils } from "../../../../Lib/src/utils/RandomUtils";
import { BlockingConstants } from "../../../../Lib/src/constants/BlockingConstants";
import { NumberChangeReason } from "../../../../Lib/src/constants/LogsConstants";
import Player from "../database/game/models/Player";
import { InventoryInfos } from "../database/game/models/InventoryInfo";
import {
	ItemCategory, ItemConstants, ItemNature, ItemRarity
} from "../../../../Lib/src/constants/ItemConstants";
import { GenericItem } from "../../data/GenericItem";
import { BlockingUtils } from "./BlockingUtils";
import {
	CrowniclesPacket, makePacket, PacketContext
} from "../../../../Lib/src/packets/CrowniclesPacket";
import {
	Potion, PotionDataController
} from "../../data/Potion";
import { WeaponDataController } from "../../data/Weapon";
import { ArmorDataController } from "../../data/Armor";
import { ObjectItemDataController } from "../../data/ObjectItem";
import { ItemDataController } from "../../data/DataController";
import { crowniclesInstance } from "../../index";
import { ItemRefusePacket } from "../../../../Lib/src/packets/events/ItemRefusePacket";
import { ItemAcceptPacket } from "../../../../Lib/src/packets/events/ItemAcceptPacket";
import { ItemFoundPacket } from "../../../../Lib/src/packets/events/ItemFoundPacket";
import {
	ReactionCollectorItemChoice,
	ReactionCollectorItemChoiceItemReaction
} from "../../../../Lib/src/packets/interaction/ReactionCollectorItemChoice";
import { ReactionCollectorInstance } from "./ReactionsCollector";
import { ReactionCollectorItemAccept } from "../../../../Lib/src/packets/interaction/ReactionCollectorItemAccept";
import { ReactionCollectorAcceptReaction } from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import { ItemWithDetails } from "../../../../Lib/src/types/ItemWithDetails";
import { MainItem } from "../../data/MainItem";
import { SupportItem } from "../../data/SupportItem";
import { StatValues } from "../../../../Lib/src/types/StatValues";


/**
 * Get the value of an item
 * @param item
 */
export function getItemValue(item: GenericItem): number {
	return Math.round(ItemConstants.RARITY.VALUES[item.rarity] + item.getItemAddedValue());
}


/**
 * Count how many potions the player have
 * @param invSlots
 */
export function countNbOfPotions(invSlots: InventorySlot[]): number {
	return invSlots.filter(slot => slot.isPotion() && slot.itemId !== 0).length;
}


/**
 * Check the missions of the player corresponding to a drink of a given potion
 * @param response
 * @param player
 * @param potion
 * @param inventorySlots
 */
export async function checkDrinkPotionMissions(response: CrowniclesPacket[], player: Player, potion: Potion, inventorySlots: InventorySlot[]): Promise<void> {
	await MissionsController.update(player, response, { missionId: "drinkPotion" });
	await MissionsController.update(player, response, {
		missionId: "drinkPotionRarity",
		params: { rarity: potion.rarity }
	});
	const tagsToVerify = potion.tags;
	if (tagsToVerify) {
		for (const tag of tagsToVerify) {
			await MissionsController.update(player, response, {
				missionId: tag,
				params: { tags: tagsToVerify }
			});
		}
	}
	if (potion.nature === ItemNature.NONE) {
		await MissionsController.update(player, response, { missionId: "drinkPotionWithoutEffect" });
	}
	if (potion.nature === ItemNature.ENERGY) {
		await MissionsController.update(player, response, { missionId: "drinkEnergyPotion" });
	}
	await MissionsController.update(player, response, {
		missionId: "havePotions",
		count: countNbOfPotions(inventorySlots),
		set: true
	});
}

function getSupportItemDetails(item: SupportItem): {
	nature: ItemNature; power: number;
} {
	return {
		nature: item.nature,
		power: item.power
	};
}

function getMainItemDetails(item: MainItem): { stats: StatValues } {
	return {
		stats: {
			attack: item.getAttack(),
			defense: item.getDefense(),
			speed: item.getSpeed()
		}
	};
}

export function toItemWithDetails(item: GenericItem): ItemWithDetails {
	const category = item.getCategory();
	return {
		id: item.id,
		category,
		rarity: item.rarity,
		detailsSupportItem: category === ItemCategory.POTION
			? getSupportItemDetails(PotionDataController.instance.getById(item.id))
			: category === ItemCategory.OBJECT
				? getSupportItemDetails(ObjectItemDataController.instance.getById(item.id))
				: null,
		detailsMainItem: category === ItemCategory.WEAPON
			? getMainItemDetails(WeaponDataController.instance.getById(item.id))
			: category === ItemCategory.ARMOR
				? getMainItemDetails(ArmorDataController.instance.getById(item.id))
				: null,
		maxStats: null
	};
}

type WhoIsConcerned = {
	player: Player;
	inventorySlots: InventorySlot[];
};

type ConcernedItems = {
	item: GenericItem;
	itemToReplace?: InventorySlot;
	itemToReplaceInstance?: GenericItem;
};

type SellKeepItemOptions = {
	keepOriginal?: boolean;
	resaleMultiplier: number;
	autoSell?: boolean;
};

/**
 * Do not keep the original item
 * @param response
 * @param player
 * @param item
 * @param itemToReplace
 */
async function dontKeepOriginalItem(response: CrowniclesPacket[], player: Player, item: GenericItem, itemToReplace: InventorySlot): Promise<void> {
	response.push(makePacket(ItemAcceptPacket, {
		itemWithDetails: toItemWithDetails(item)
	}));
	await InventorySlot.update({
		itemId: item.id
	}, {
		where: {
			slot: itemToReplace.slot,
			itemCategory: itemToReplace.itemCategory,
			playerId: player.id
		}
	});
	await MissionsController.update(player, response, {
		missionId: "haveItemRarity",
		params: { rarity: item.rarity }
	});
	crowniclesInstance.logsDatabase.logItemGain(player.keycloakId, item)
		.then();
}

/**
 * Manage the money payment from a sold item
 * @param response
 * @param player
 * @param item
 * @param money
 */
async function manageMoneyPayment(response: CrowniclesPacket[], player: Player, item: GenericItem, money: number): Promise<void> {
	await player.addMoney({
		amount: money,
		response,
		reason: NumberChangeReason.ITEM_SELL
	});
	await MissionsController.update(player, response, {
		missionId: "sellItemWithGivenCost",
		params: { itemCost: money }
	});
	await player.save();
	crowniclesInstance.logsDatabase.logItemSell(player.keycloakId, item)
		.then();
}

/**
 * Manage the related actions of the item refusal
 * @param response
 * @param player
 * @param inventorySlots
 * @param item
 * @param money
 * @param autoSell
 */
async function manageItemRefusal(response: CrowniclesPacket[], {
	player,
	inventorySlots
}: WhoIsConcerned, item: GenericItem, money: number, autoSell: boolean): Promise<void> {
	response.push(makePacket(ItemRefusePacket, {
		item: {
			id: item.id,
			category: item.getCategory()
		},
		autoSell,
		soldMoney: money
	}));
	await MissionsController.update(player, response, { missionId: "findOrBuyItem" });
	await player.reload();
	await MissionsController.update(player, response, {
		missionId: "havePotions",
		count: countNbOfPotions(inventorySlots),
		set: true
	});
}

/**
 * Sells or keep the item depending on the parameters
 * @param response
 * @param whoIsConcerned
 * @param item
 * @param itemToReplace
 * @param itemToReplaceInstance
 * @param keepOriginal
 * @param resaleMultiplier
 * @param autoSell
 */
async function sellOrKeepItem(
	response: CrowniclesPacket[],
	whoIsConcerned: WhoIsConcerned,
	{
		item,
		itemToReplace,
		itemToReplaceInstance
	}: ConcernedItems,
	{
		keepOriginal,
		resaleMultiplier,
		autoSell
	}: SellKeepItemOptions
): Promise<void> {
	const player = whoIsConcerned.player;
	await player.reload();
	if (!keepOriginal) {
		await dontKeepOriginalItem(response, player, item, itemToReplace);
		item = itemToReplaceInstance;
		resaleMultiplier = 1;
	}
	let money = 0;
	if (item.getCategory() !== ItemCategory.POTION) {
		money = Math.round(getItemValue(item) * resaleMultiplier);
		await manageMoneyPayment(response, player, item, money);
	}
	await manageItemRefusal(response, whoIsConcerned, item, money, autoSell);
}

/**
 * Get the end callback of the MoreThan2ItemsSwitching collector
 * @param whoIsConcerned
 * @param toTradeItem
 * @param tradableItems
 * @param sellKeepOptions
 */
function getMoreThan2ItemsSwitchingEndCallback(whoIsConcerned: WhoIsConcerned, toTradeItem: GenericItem, tradableItems: InventorySlot[], sellKeepOptions: SellKeepItemOptions) {
	return async (collector: ReactionCollectorInstance, response: CrowniclesPacket[]): Promise<void> => {
		const reaction = collector.getFirstReaction();
		await whoIsConcerned.player.reload();

		const concernedItems: ConcernedItems = {
			item: toTradeItem
		};

		if (reaction?.reaction.type === ReactionCollectorItemChoiceItemReaction.name) {
			const itemReaction = reaction.reaction.data as ReactionCollectorItemChoiceItemReaction;
			const invSlot = tradableItems.find(i => i.slot === itemReaction.slot);
			concernedItems.itemToReplace = invSlot;
			concernedItems.itemToReplaceInstance = invSlot.getItem();
		}
		else {
			sellKeepOptions.keepOriginal = true;
		}
		BlockingUtils.unblockPlayer(whoIsConcerned.player.keycloakId, BlockingConstants.REASONS.ACCEPT_ITEM);
		await sellOrKeepItem(response, whoIsConcerned, concernedItems, sellKeepOptions);
	};
}

type ItemsToManage = {
	toTradeItem: GenericItem;
	tradableItems: InventorySlot[];
};

/**
 * Manage more than 2 item to choose to keep in the inventory
 * @param response
 * @param context
 * @param player
 * @param whoIsConcerned
 * @param toTradeItem
 * @param tradableItems
 * @param sellKeepOptions
 */
function manageMoreThan2ItemsSwitching(
	response: CrowniclesPacket[],
	context: PacketContext,
	whoIsConcerned: WhoIsConcerned,
	{
		toTradeItem,
		tradableItems
	}: ItemsToManage,
	sellKeepOptions: SellKeepItemOptions
): void {
	const keycloakId = whoIsConcerned.player.keycloakId;
	tradableItems.sort((a: InventorySlot, b: InventorySlot) => (a.slot > b.slot ? 1 : b.slot > a.slot ? -1 : 0));

	const collector = new ReactionCollectorItemChoice({
		item: {
			id: toTradeItem.id,
			category: toTradeItem.getCategory()
		}
	},
	tradableItems.map(i => ({
		slot: i.slot,
		itemWithDetails: toItemWithDetails(i.getItem())
	})));

	response.push(new ReactionCollectorInstance(
		collector,
		context,
		{
			allowedPlayerKeycloakIds: [keycloakId],
			reactionLimit: 1,
			mainPacket: false
		},
		getMoreThan2ItemsSwitchingEndCallback(whoIsConcerned, toTradeItem, tradableItems, sellKeepOptions)
	)
		.block(keycloakId, BlockingConstants.REASONS.ACCEPT_ITEM)
		.build());
}


async function manageGiveItemRelateds(response: CrowniclesPacket[], player: Player, item: GenericItem): Promise<void> {
	await MissionsController.update(player, response, { missionId: "findOrBuyItem" });
	await MissionsController.update(player, response, {
		missionId: "havePotions",
		count: countNbOfPotions(await InventorySlots.getOfPlayer(player.id)),
		set: true
	});
	await MissionsController.update(player, response, {
		missionId: "haveItemRarity",
		params: { rarity: item.rarity }
	});
	crowniclesInstance.logsDatabase.logItemGain(player.keycloakId, item)
		.then();
}

function getGiveItemToPlayerEndCallback(whoIsConcerned: WhoIsConcerned, concernedItems: ConcernedItems, resaleMultiplier: number) {
	return async (collector: ReactionCollectorInstance, response: CrowniclesPacket[]): Promise<void> => {
		const reaction = collector.getFirstReaction();
		const isValidated = reaction && reaction.reaction.type === ReactionCollectorAcceptReaction.name;
		await whoIsConcerned.player.reload();
		BlockingUtils.unblockPlayer(whoIsConcerned.player.keycloakId, BlockingConstants.REASONS.ACCEPT_ITEM);
		await sellOrKeepItem(response, whoIsConcerned, concernedItems, {
			keepOriginal: !isValidated,
			resaleMultiplier
		});
	};
}

/**
 * Gives an item to a player
 * @param response
 * @param context
 * @param player
 * @param item
 * @param resaleMultiplier
 */
export async function giveItemToPlayer(
	response: CrowniclesPacket[],
	context: PacketContext,
	player: Player,
	item: GenericItem,
	resaleMultiplier = 1
): Promise<void> {
	const inventorySlots = await InventorySlots.getOfPlayer(player.id);
	const whoIsConcerned = {
		player,
		inventorySlots
	};

	response.push(makePacket(ItemFoundPacket, {
		itemWithDetails: toItemWithDetails(item)
	}));

	if (await player.giveItem(item) === true) {
		await manageGiveItemRelateds(response, player, item);
		return;
	}

	const category = item.getCategory();
	const maxSlots = (await InventoryInfos.getOfPlayer(player.id)).slotLimitForCategory(category);
	const items = inventorySlots.filter((slot: InventorySlot) => slot.itemCategory === category && !slot.isEquipped());
	const itemToReplace = inventorySlots.filter((slot: InventorySlot) => (maxSlots === 1 ? slot.isEquipped() : slot.slot === 1) && slot.itemCategory === category)[0];
	const autoSell = maxSlots >= 3
		? items.length === items.filter((slot: InventorySlot) => slot.itemId === item.id).length
		: itemToReplace.itemId === item.id;

	if (autoSell) {
		await sellOrKeepItem(response, whoIsConcerned, {
			item
		}, {
			keepOriginal: true,
			resaleMultiplier,
			autoSell: true
		});
		return;
	}

	if (maxSlots >= 3) {
		manageMoreThan2ItemsSwitching(response, context, whoIsConcerned, {
			toTradeItem: item,
			tradableItems: items
		}, { resaleMultiplier });
		return;
	}

	const itemToReplaceInstance = itemToReplace.getItem();

	response.push(new ReactionCollectorInstance(
		new ReactionCollectorItemAccept(
			toItemWithDetails(itemToReplaceInstance)
		),
		context,
		{
			allowedPlayerKeycloakIds: [player.keycloakId],
			reactionLimit: 1,
			mainPacket: false
		},
		getGiveItemToPlayerEndCallback(whoIsConcerned, {
			item,
			itemToReplace,
			itemToReplaceInstance
		}, resaleMultiplier)
	)
		.block(player.keycloakId, BlockingConstants.REASONS.ACCEPT_ITEM)
		.build());
}


/**
 * Generate a random rarity. Legendary is very rare and common is not rare at all
 * @param minRarity
 * @param maxRarity
 * @returns generated rarity
 */
export function generateRandomRarity(minRarity: ItemRarity = ItemRarity.COMMON, maxRarity: ItemRarity = ItemRarity.MYTHICAL): ItemRarity {
	const randomValue = RandomUtils.crowniclesRandom.integer(
		1 + (minRarity === ItemRarity.COMMON ? -1 : ItemConstants.RARITY.GENERATOR.VALUES[minRarity - 2]),
		ItemConstants.RARITY.GENERATOR.MAX_VALUE
		- (maxRarity === ItemRarity.MYTHICAL
			? 0
			: ItemConstants.RARITY.GENERATOR.MAX_VALUE
			- ItemConstants.RARITY.GENERATOR.VALUES[maxRarity - 1])
	);
	let rarity = ItemRarity.BASIC;
	do {
		rarity++; // We increase rarity until we find the generated one
	} while (randomValue > ItemConstants.RARITY.GENERATOR.VALUES[rarity - 1]);
	return rarity;
}


/**
 * Generate a random itemType
 * @returns
 */
export function generateRandomItemCategory(): ItemCategory {
	return RandomUtils.enumPick(ItemCategory);
}


const controllers = [
	WeaponDataController.instance,
	ArmorDataController.instance,
	PotionDataController.instance,
	ObjectItemDataController.instance
];

export type GenerateRandomItemOptions = {
	itemCategory?: ItemCategory;
	minRarity?: ItemRarity;
	maxRarity?: ItemRarity;
	subType?: ItemNature;
};

/**
 * Generates a random item given its category and the rarity limits
 * @param itemCategory
 * @param minRarity
 * @param maxRarity
 * @param itemSubType
 */
export function generateRandomItem(
	{
		itemCategory,
		minRarity,
		maxRarity,
		subType
	}: GenerateRandomItemOptions
): GenericItem {
	const rarity = generateRandomRarity(minRarity ?? ItemRarity.COMMON, maxRarity ?? ItemRarity.MYTHICAL);
	const category = itemCategory ?? generateRandomItemCategory();
	const controller = controllers[category];
	if ([ItemCategory.POTION, ItemCategory.OBJECT].includes(category) && subType !== undefined) { // 0 (no effect) is a false value
		return (controller as PotionDataController | ObjectItemDataController).randomItem(subType, rarity);
	}
	const itemsIds = controller.getAllIdsForRarity(rarity);
	return controller.getById(itemsIds[RandomUtils.crowniclesRandom.integer(0, itemsIds.length - 1)]);
}


/**
 * Give a random item
 * @param context
 * @param response
 * @param player
 */
export async function giveRandomItem(context: PacketContext, response: CrowniclesPacket[], player: Player): Promise<void> {
	await giveItemToPlayer(response, context, player, generateRandomItem({}));
}

type TemporarySlotAndItemType = {
	slot: InventorySlot;
	item: GenericItem;
};


/**
 * Sort an item slots list by type then price
 * @param items
 */
export function sortPlayerItemList(items: InventorySlot[]): InventorySlot[] {
	return items.map(invSlot => ({
		slot: invSlot,
		item: invSlot.getItem()
	}))
		.sort(
			(a: TemporarySlotAndItemType, b: TemporarySlotAndItemType) =>
				(a.slot.itemCategory !== b.slot.itemCategory
					? a.slot.itemCategory - b.slot.itemCategory
					: getItemValue(b.item) - getItemValue(a.item))
		)
		.map(e => e.slot);
}


/**
 * Checks if the given inventory slots have an item with a rarity of at least the given rarity
 * @param slots
 * @param rarity
 */
export function haveRarityOrMore(slots: InventorySlot[], rarity: ItemRarity): boolean {
	return !slots.every(slot => slot.getItem().rarity < rarity);
}

/**
 * Get a portion of the model corresponding to the category number
 * @param category
 */
function getCategoryDataByName(category: ItemCategory): ItemDataController<GenericItem> {
	switch (category) {
		case ItemCategory.WEAPON:
			return WeaponDataController.instance;
		case ItemCategory.ARMOR:
			return ArmorDataController.instance;
		case ItemCategory.POTION:
			return PotionDataController.instance;
		case ItemCategory.OBJECT:
			return ObjectItemDataController.instance;
		default:
			return null;
	}
}

/**
 * Get an item by its id and its category number
 * @param itemId
 * @param category
 */
export function getItemByIdAndCategory(itemId: number, category: ItemCategory): GenericItem {
	const categoryDataController = getCategoryDataByName(category);
	if (!categoryDataController) {
		return null;
	}
	return itemId <= categoryDataController.getMaxId() && itemId > 0 ? categoryDataController.getById(itemId) : null;
}
