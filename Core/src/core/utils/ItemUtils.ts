import InventorySlot, {InventorySlots} from "../database/game/models/InventorySlot";
import {MissionsController} from "../missions/MissionsController";
import {RandomUtils} from "../../../../Lib/src/utils/RandomUtils";
import {BlockingConstants} from "../../../../Lib/src/constants/BlockingConstants";
import {NumberChangeReason} from "../../../../Lib/src/constants/LogsConstants";
import Player, {Players} from "../database/game/models/Player";
import {InventoryInfos} from "../database/game/models/InventoryInfo";
import {ItemCategory, ItemConstants, ItemNature, ItemRarity} from "../../../../Lib/src/constants/ItemConstants";
import {GenericItem} from "../../data/GenericItem";
import {BlockingUtils} from "./BlockingUtils";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {Potion, PotionDataController} from "../../data/Potion";
import {WeaponDataController} from "../../data/Weapon";
import {ArmorDataController} from "../../data/Armor";
import {ObjectItemDataController} from "../../data/ObjectItem";
import {ItemDataController} from "../../data/DataController";
import {draftBotInstance} from "../../index";
import {ItemRefusePacket} from "../../../../Lib/src/packets/events/ItemRefusePacket";
import {ItemAcceptPacket} from "../../../../Lib/src/packets/events/ItemAcceptPacket";
import {ItemFoundPacket} from "../../../../Lib/src/packets/events/ItemFoundPacket";
import {
	ReactionCollectorItemChoice,
	ReactionCollectorItemChoiceItemReaction
} from "../../../../Lib/src/packets/interaction/ReactionCollectorItemChoice";
import {EndCallback, ReactionCollectorInstance} from "./ReactionsCollector";
import {ReactionCollectorItemAccept} from "../../../../Lib/src/packets/interaction/ReactionCollectorItemAccept";
import {ReactionCollectorAcceptReaction} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {ItemWithDetails} from "../../../../Lib/src/types/ItemWithDetails";
import {MainItem} from "../../data/MainItem";
import {SupportItem} from "../../data/SupportItem";
import {StatValues} from "../../../../Lib/src/types/StatValues";

/**
 * Get the value of an item
 * @param item
 */
export const getItemValue = function(item: GenericItem): number {
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
 * @param response
 * @param player
 * @param potion
 * @param inventorySlots
 */
export const checkDrinkPotionMissions = async function(response: DraftBotPacket[], player: Player, potion: Potion, inventorySlots: InventorySlot[]): Promise<void> {
	await MissionsController.update(player, response, {missionId: "drinkPotion"});
	await MissionsController.update(player, response, {
		missionId: "drinkPotionRarity",
		params: {rarity: potion.rarity}
	});
	const tagsToVerify = potion.tags;
	if (tagsToVerify) {
		for (const tag of tagsToVerify) {
			await MissionsController.update(player, response, {
				missionId: tag,
				params: {tags: tagsToVerify}
			});
		}
	}
	if (potion.nature === ItemNature.NONE) {
		await MissionsController.update(player, response, {missionId: "drinkPotionWithoutEffect"});
	}
	if (potion.nature === ItemNature.ENERGY) {
		await MissionsController.update(player, response, {missionId: "drinkEnergyPotion"});
	}
	await MissionsController.update(player, response, {
		missionId: "havePotions",
		count: countNbOfPotions(inventorySlots),
		set: true
	});
};

const getSupportItemDetails = function(item: SupportItem): { nature: ItemNature, power: number } {
	return {
		nature: item.nature,
		power: item.power
	};
};

const getMainItemDetails = function(item: MainItem): { stats: StatValues } {
	return {
		stats: {
			attack: item.getAttack(),
			defense: item.getDefense(),
			speed: item.getSpeed()
		}
	};
};

export const toItemWithDetails = function(item: GenericItem): ItemWithDetails {
	const category = item.getCategory();
	return {
		id: item.id,
		category,
		rarity: item.rarity,
		detailsSupportItem: category === ItemCategory.POTION ?
			getSupportItemDetails(PotionDataController.instance.getById(item.id))
			: category === ItemCategory.OBJECT ?
				getSupportItemDetails(ObjectItemDataController.instance.getById(item.id))
				: null,
		detailsMainItem: category === ItemCategory.WEAPON ?
			getMainItemDetails(WeaponDataController.instance.getById(item.id))
			: category === ItemCategory.ARMOR ?
				getMainItemDetails(ArmorDataController.instance.getById(item.id))
				: null,
		maxStats: null
	};
};

/**
 * Sells or keep the item depending on the parameters
 * @param player
 * @param keepOriginal
 * @param response
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
	response: DraftBotPacket[],
	item: GenericItem,
	itemToReplace: InventorySlot,
	itemToReplaceInstance: GenericItem,
	resaleMultiplier: number,
	resaleMultiplierActual: number,
	autoSell: boolean,
	inventorySlots: InventorySlot[]
): Promise<void> {
	player = await Players.getById(player.id);
	if (!keepOriginal) {
		const packet = makePacket(ItemAcceptPacket, {
			itemWithDetails: toItemWithDetails(item)
		});
		response.push(packet);
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
			}
		);
		await MissionsController.update(player, response, {
			missionId: "haveItemRarity",
			params: {rarity: item.rarity}
		});
		draftBotInstance.logsDatabase.logItemGain(player.keycloakId, item)
			.then();
		item = itemToReplaceInstance;
		resaleMultiplier = resaleMultiplierActual;
	}
	let money = 0;
	if (item.getCategory() !== ItemCategory.POTION) {
		money = Math.round(getItemValue(item) * resaleMultiplier);
		await player.addMoney({
			amount: money,
			response,
			reason: NumberChangeReason.ITEM_SELL
		});
		await MissionsController.update(player, response, {
			missionId: "sellItemWithGivenCost",
			params: {itemCost: money}
		});
		await player.save();
		draftBotInstance.logsDatabase.logItemSell(player.keycloakId, item)
			.then();
	}
	const packet = makePacket(ItemRefusePacket, {
		item: {id: item.id, category: item.getCategory()},
		autoSell,
		soldMoney: money
	});
	response.push(packet);
	await MissionsController.update(player, response, {missionId: "findOrBuyItem"});
	player = await Players.getById(player.id);
	await MissionsController.update(player, response, {
		missionId: "havePotions",
		count: countNbOfPotions(inventorySlots),
		set: true
	});
};

/**
 * Manage more than 2 item to choose to keep in the inventory
 * @param items
 * @param player
 * @param context
 * @param response
 * @param item
 * @param resaleMultiplier
 * @param resaleMultiplierActual
 * @param inventorySlots
 */
// eslint-disable-next-line max-params
function manageMoreThan2ItemsSwitching(
	items: InventorySlot[],
	player: Player,
	context: PacketContext,
	response: DraftBotPacket[],
	item: GenericItem,
	resaleMultiplier: number,
	resaleMultiplierActual: number,
	inventorySlots: InventorySlot[]
): void {
	// eslint-disable-next-line @typescript-eslint/no-extra-parens
	items.sort((a: InventorySlot, b: InventorySlot) => (a.slot > b.slot ? 1 : b.slot > a.slot ? -1 : 0));

	const collector = new ReactionCollectorItemChoice(
		{item: {id: item.id, category: item.getCategory()}},
		items.map((item) => ({slot: item.slot, itemWithDetails: toItemWithDetails(item.getItem())}))
	);

	const endCallback: EndCallback = async (collector: ReactionCollectorInstance, response: DraftBotPacket[]): Promise<void> => {
		const reaction = collector.getFirstReaction();

		if (reaction && reaction.reaction.type === ReactionCollectorItemChoiceItemReaction.name) {
			const itemReaction = reaction.reaction.data as ReactionCollectorItemChoiceItemReaction;
			const invSlot = items.find((item) => item.slot === itemReaction.slot);

			player = await Players.getById(player.id);
			BlockingUtils.unblockPlayer(player.keycloakId, BlockingConstants.REASONS.ACCEPT_ITEM);
			await sellOrKeepItem(
				player,
				false,
				response,
				item,
				invSlot,
				invSlot.getItem(),
				resaleMultiplier,
				resaleMultiplierActual,
				false,
				inventorySlots
			);
		}
		else {
			player = await Players.getById(player.id);
			BlockingUtils.unblockPlayer(player.keycloakId, BlockingConstants.REASONS.ACCEPT_ITEM);
			await sellOrKeepItem(
				player,
				true,
				response,
				item,
				null,
				null,
				resaleMultiplier,
				resaleMultiplierActual,
				false,
				inventorySlots
			);
		}
	};

	const packet = new ReactionCollectorInstance(
		collector,
		context,
		{
			allowedPlayerKeycloakIds: [player.keycloakId],
			reactionLimit: 1,
			mainPacket: false
		},
		endCallback
	)
		.block(player.keycloakId, BlockingConstants.REASONS.ACCEPT_ITEM)
		.build();

	response.push(packet);
}

/**
 * Gives an item to a player
 * @param player
 * @param item
 * @param context
 * @param response
 * @param inventorySlots
 * @param resaleMultiplierNew
 * @param resaleMultiplierActual
 */
// eslint-disable-next-line max-params
export const giveItemToPlayer = async function(
	player: Player,
	item: GenericItem,
	context: PacketContext,
	response: DraftBotPacket[],
	inventorySlots: InventorySlot[],
	resaleMultiplierNew = 1,
	resaleMultiplierActual = 1
): Promise<void> {
	const resaleMultiplier = resaleMultiplierNew;
	response.push(makePacket(ItemFoundPacket, {
		itemWithDetails: toItemWithDetails(item)
	}));

	if (await player.giveItem(item) === true) {
		await MissionsController.update(player, response, {missionId: "findOrBuyItem"});
		await MissionsController.update(player, response, {
			missionId: "havePotions",
			count: countNbOfPotions(await InventorySlots.getOfPlayer(player.id)),
			set: true
		});
		await MissionsController.update(player, response, {
			missionId: "haveItemRarity",
			params: {rarity: item.rarity}
		});
		draftBotInstance.logsDatabase.logItemGain(player.keycloakId, item)
			.then();
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
			manageMoreThan2ItemsSwitching(items, player, context, response, item, resaleMultiplier, resaleMultiplierActual, inventorySlots);
			return;
		}
	}
	if (autoSell) {
		await sellOrKeepItem(
			player,
			true,
			response,
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

	const itemToReplaceInstance = itemToReplace.getItem();

	const collector = new ReactionCollectorItemAccept(
		toItemWithDetails(itemToReplaceInstance)
	);

	const endCallback: EndCallback = async (collector: ReactionCollectorInstance, response: DraftBotPacket[]): Promise<void> => {
		const reaction = collector.getFirstReaction();
		const isValidated = reaction && reaction.reaction.type === ReactionCollectorAcceptReaction.name;
		player = await Players.getById(player.id);
		BlockingUtils.unblockPlayer(player.keycloakId, BlockingConstants.REASONS.ACCEPT_ITEM);
		await sellOrKeepItem(
			player,
			!isValidated,
			response,
			item,
			itemToReplace,
			itemToReplaceInstance,
			resaleMultiplier,
			resaleMultiplierActual,
			false,
			inventorySlots
		);
	};

	const packet = new ReactionCollectorInstance(
		collector,
		context,
		{
			allowedPlayerKeycloakIds: [player.keycloakId],
			reactionLimit: 1,
			mainPacket: false
		},
		endCallback
	)
		.block(player.keycloakId, BlockingConstants.REASONS.ACCEPT_ITEM)
		.build();

	response.push(packet);
};

/**
 * Generate a random rarity. Legendary is very rare and common is not rare at all
 * @param minRarity
 * @param maxRarity
 * @returns generated rarity
 */
export const generateRandomRarity = function(minRarity: ItemRarity = ItemRarity.COMMON, maxRarity: ItemRarity = ItemRarity.MYTHICAL): ItemRarity {
	const randomValue = RandomUtils.draftbotRandom.integer(
		1 + (minRarity === ItemRarity.COMMON ? -1 : ItemConstants.RARITY.GENERATOR.VALUES[minRarity - 2]),
		ItemConstants.RARITY.GENERATOR.MAX_VALUE
		- (maxRarity === ItemRarity.MYTHICAL ? 0 : ItemConstants.RARITY.GENERATOR.MAX_VALUE
			- ItemConstants.RARITY.GENERATOR.VALUES[maxRarity - 1])
	);
	let rarity = ItemRarity.BASIC;
	do {
		rarity++; // We increase rarity until we find the generated one
	} while (randomValue > ItemConstants.RARITY.GENERATOR.VALUES[rarity - 1]);
	return rarity;
};

/**
 * Generate a random itemType
 * @returns
 */
export const generateRandomItemCategory = function(): ItemCategory {
	return RandomUtils.enumPick(ItemCategory);
};

/**
 * Generates a random item given its category and the rarity limits
 * @param itemCategory
 * @param minRarity
 * @param maxRarity
 * @param itemSubType
 */
export function generateRandomItem(
	itemCategory: ItemCategory = null,
	minRarity: ItemRarity = ItemRarity.COMMON,
	maxRarity: ItemRarity = ItemRarity.MYTHICAL,
	itemSubType: ItemNature = null
): GenericItem {
	const rarity = generateRandomRarity(minRarity, maxRarity);
	const category = itemCategory ?? generateRandomItemCategory();
	let itemsIds;
	switch (category) {
	case ItemCategory.WEAPON:
		itemsIds = WeaponDataController.instance.getAllIdsForRarity(rarity);
		return WeaponDataController.instance.getById(itemsIds[RandomUtils.draftbotRandom.integer(0, itemsIds.length - 1)]);
	case ItemCategory.ARMOR:
		itemsIds = ArmorDataController.instance.getAllIdsForRarity(rarity);
		return ArmorDataController.instance.getById(itemsIds[RandomUtils.draftbotRandom.integer(0, itemsIds.length - 1)]);
	case ItemCategory.POTION:
		if (itemSubType !== null) { // 0 (no effect) is a false value
			return PotionDataController.instance.randomItem(itemSubType, rarity);
		}
		itemsIds = PotionDataController.instance.getAllIdsForRarity(rarity);
		return PotionDataController.instance.getById(itemsIds[RandomUtils.randInt(0, itemsIds.length)]);
	default:
		// This will be triggered by ItemCategory.OBJECT
		if (itemSubType !== null) {
			return ObjectItemDataController.instance.randomItem(itemSubType, rarity);
		}
		itemsIds = ObjectItemDataController.instance.getAllIdsForRarity(rarity);
		return ObjectItemDataController.instance.getById(itemsIds[RandomUtils.randInt(0, itemsIds.length)]);
	}
}

/**
 * Give a random item
 * @param context
 * @param response
 * @param player
 */
export const giveRandomItem = async function(context: PacketContext, response: DraftBotPacket[], player: Player): Promise<void> {
	await giveItemToPlayer(player, generateRandomItem(), context, response, await InventorySlots.getOfPlayer(player.id));
};

type TemporarySlotAndItemType = {
	slot: InventorySlot,
	item: GenericItem
};

/**
 * Sort an item slots list by type then price
 * @param items
 */
export const sortPlayerItemList = function(items: InventorySlot[]): InventorySlot[] {
	let itemInstances: TemporarySlotAndItemType[] = items.map(function(invSlot) {
		return {
			slot: invSlot,
			item: invSlot.getItem()
		};
	});
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
export const haveRarityOrMore = function(slots: InventorySlot[], rarity: ItemRarity): boolean {
	for (const slot of slots) {
		if (slot.getItem().rarity >= rarity) {
			return true;
		}
	}
	return false;
};

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