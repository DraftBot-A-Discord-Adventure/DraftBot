import {TextBasedChannel, User} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {TranslationModule, Translations} from "../Translations";
import {ChoiceItem, DraftBotListChoiceMessage} from "../messages/DraftBotListChoiceMessage";
import {DraftBotValidateReactionMessage} from "../messages/DraftBotValidateReactionMessage";
import {Constants} from "../Constants";
import {format} from "./StringFormatter";
import {Armors} from "../database/game/models/Armor";
import {Weapons} from "../database/game/models/Weapon";
import Potion, {Potions} from "../database/game/models/Potion";
import {ObjectItems} from "../database/game/models/ObjectItem";
import Entity, {Entities} from "../database/game/models/Entity";
import InventorySlot from "../database/game/models/InventorySlot";
import {MissionsController} from "../missions/MissionsController";
import {GenericItemModel} from "../database/game/models/GenericItemModel";
import Player from "../database/game/models/Player";
import {BlockingUtils} from "./BlockingUtils";
import {RandomUtils} from "./RandomUtils";
import {BlockingConstants} from "../constants/BlockingConstants";
import {Tags} from "../database/game/models/Tag";
import {NumberChangeReason} from "../database/logs/LogsDatabase";
import {draftBotInstance} from "../bot";

/**
 * Count how many potions the player have
 * @param player
 */
export const countNbOfPotions = function(player: Player): number {
	let nbPotions = player.getMainPotionSlot().itemId === 0 ? -1 : 0;
	for (const slot of player.InventorySlots) {
		nbPotions += slot.isPotion() ? 1 : 0;
	}
	return nbPotions;
};

/**
 * Check the missions of the player corresponding to a drink of a given potion
 * @param channel
 * @param language
 * @param entity
 * @param potion
 */
export const checkDrinkPotionMissions = async function(channel: TextBasedChannel, language: string, entity: Entity, potion: Potion): Promise<void> {
	await MissionsController.update(entity, channel, language, {missionId: "drinkPotion"});
	await MissionsController.update(entity, channel, language, {
		missionId: "drinkPotionRarity",
		params: {rarity: potion.rarity}
	});
	const tagsToVerify = await Tags.findTagsFromObject(potion.id, Potion.name);
	if (tagsToVerify) {
		for (let i = 0; i < tagsToVerify.length; i++) {
			await MissionsController.update(entity, channel, language, {
				missionId: tagsToVerify[i].textTag,
				params: {tags: tagsToVerify}
			});
		}
	}
	if (potion.nature === Constants.NATURE.NONE) {
		await MissionsController.update(entity, channel, language, {missionId: "drinkPotionWithoutEffect"});
	}
	await MissionsController.update(entity, channel, language, {
		missionId: "havePotions",
		count: countNbOfPotions(entity.Player),
		set: true
	});
};

/**
 * Sells or keep the item depending on the parameters
 * @param entity
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
 */
// eslint-disable-next-line max-params
const sellOrKeepItem = async function(
	entity: Entity,
	keepOriginal: boolean,
	discordUser: User,
	channel: TextBasedChannel,
	language: string,
	item: GenericItemModel,
	itemToReplace: InventorySlot,
	itemToReplaceInstance: GenericItemModel,
	resaleMultiplier: number,
	resaleMultiplierActual: number,
	autoSell: boolean
): Promise<void> {
	const tr = Translations.getModule("commands.inventory", language);
	entity = await Entities.getById(entity.id);
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
					playerId: entity.Player.id
				}
			});
		await MissionsController.update(entity, channel, language, {
			missionId: "haveItemRarity",
			params: {rarity: item.rarity}
		});
		draftBotInstance.logsDatabase.logItemGain(entity.discordUserId, item).then();
		await channel.send({embeds: [menuEmbed]});
		item = itemToReplaceInstance;
		resaleMultiplier = resaleMultiplierActual;
	}
	const trSell = Translations.getModule("commands.sell", language);
	if (item.getCategory() === Constants.ITEM_CATEGORIES.POTION) {
		await channel.send({
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
	await entity.Player.addMoney({
		entity,
		amount: money,
		channel,
		language,
		reason: NumberChangeReason.ITEM_SELL
	});
	await MissionsController.update(entity, channel, language, {
		missionId: "sellItemWithGivenCost",
		params: {itemCost: money}
	});
	await entity.Player.save();
	draftBotInstance.logsDatabase.logItemSell(entity.discordUserId, item).then();
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
	await MissionsController.update(entity, channel, language, {missionId: "findOrBuyItem"});
	[entity] = await Entities.getOrRegister(entity.discordUserId);
	await MissionsController.update(entity, channel, language, {
		missionId: "havePotions",
		count: countNbOfPotions(entity.Player),
		set: true
	});
};

/**
 * Manage more than 2 item to choose to keep in the inventory
 * @param items
 * @param discordUser
 * @param entity
 * @param channel
 * @param item
 * @param resaleMultiplier
 * @param resaleMultiplierActual
 * @param tr
 */
// eslint-disable-next-line max-params
async function manageMoreThan2ItemsSwitching(
	items: InventorySlot[],
	discordUser: User,
	entity: Entity,
	channel: TextBasedChannel,
	item: GenericItemModel,
	resaleMultiplier: number,
	resaleMultiplierActual: number,
	tr: TranslationModule
): Promise<void> {
	const choiceList: ChoiceItem[] = [];
	// eslint-disable-next-line @typescript-eslint/no-extra-parens
	items.sort((a: InventorySlot, b: InventorySlot) => (a.slot > b.slot ? 1 : b.slot > a.slot ? -1 : 0));
	for (const item of items) {
		choiceList.push(new ChoiceItem(
			(await item.getItem()).toString(tr.language, null),
			item
		));
	}
	const choiceMessage = new DraftBotListChoiceMessage(
		choiceList,
		discordUser.id,
		async (replacedItem: InventorySlot) => {
			[entity] = await Entities.getOrRegister(entity.discordUserId);
			BlockingUtils.unblockPlayer(discordUser.id, BlockingConstants.REASONS.ACCEPT_ITEM);
			await sellOrKeepItem(
				entity,
				false,
				discordUser,
				channel,
				tr.language,
				item,
				replacedItem,
				await replacedItem.getItem(),
				resaleMultiplier,
				resaleMultiplierActual,
				false
			);
		},
		async (endMessage: DraftBotListChoiceMessage) => {
			if (endMessage.isCanceled()) {
				BlockingUtils.unblockPlayer(discordUser.id, BlockingConstants.REASONS.ACCEPT_ITEM);
				await sellOrKeepItem(
					entity,
					true,
					discordUser,
					channel,
					tr.language,
					item,
					null,
					null,
					resaleMultiplier,
					resaleMultiplierActual,
					false
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
 * @param entity
 * @param item
 * @param language
 * @param discordUser
 * @param channel
 * @param resaleMultiplierNew
 * @param resaleMultiplierActual
 */
// eslint-disable-next-line max-params
export const giveItemToPlayer = async function(
	entity: Entity,
	item: GenericItemModel,
	language: string,
	discordUser: User,
	channel: TextBasedChannel,
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

	if (await entity.Player.giveItem(item) === true) {
		await MissionsController.update(entity, channel, language, {missionId: "findOrBuyItem"});
		const entityForMC = (await Entities.getOrRegister(entity.discordUserId))[0];
		await MissionsController.update(entityForMC, channel, language, {
			missionId: "havePotions",
			count: countNbOfPotions(entityForMC.Player),
			set: true
		});
		await MissionsController.update(entity, channel, language, {
			missionId: "haveItemRarity",
			params: {rarity: item.rarity}
		});
		draftBotInstance.logsDatabase.logItemGain(entity.discordUserId, item).then();
		return;
	}

	const category = item.getCategory();
	const maxSlots = entity.Player.InventoryInfo.slotLimitForCategory(category);
	let itemToReplace: InventorySlot;
	let autoSell = false;
	if (maxSlots < 3) {
		itemToReplace = entity.Player.InventorySlots.filter((slot: InventorySlot) => (maxSlots === 1 ? slot.isEquipped() : slot.slot === 1) && slot.itemCategory === category)[0];
		autoSell = itemToReplace.itemId === item.id;
	}
	else {
		const items = entity.Player.InventorySlots.filter((slot: InventorySlot) => slot.itemCategory === category && !slot.isEquipped());
		if (items.length === items.filter((slot: InventorySlot) => slot.itemId === item.id).length) {
			autoSell = true;
		}
		else {
			await manageMoreThan2ItemsSwitching(items, discordUser, entity, channel, item, resaleMultiplier, resaleMultiplierActual, tr);
			return;
		}
	}
	if (autoSell) {
		await sellOrKeepItem(
			entity,
			true,
			discordUser,
			channel,
			language,
			item,
			null,
			null,
			resaleMultiplier,
			resaleMultiplierActual,
			true
		);
		return;
	}

	const itemToReplaceInstance = await itemToReplace.getItem();
	await new DraftBotValidateReactionMessage(
		discordUser,
		async (msg: DraftBotValidateReactionMessage) => {
			[entity] = await Entities.getOrRegister(entity.discordUserId);
			BlockingUtils.unblockPlayer(discordUser.id, BlockingConstants.REASONS.ACCEPT_ITEM);
			await sellOrKeepItem(
				entity,
				!msg.isValidated(),
				discordUser,
				channel,
				language,
				item,
				itemToReplace,
				itemToReplaceInstance,
				resaleMultiplier,
				resaleMultiplierActual,
				false
			);
		}
	)
		.formatAuthor(tr.get(item.getCategory() === Constants.ITEM_CATEGORIES.POTION ? "randomItemFooterPotion" : "randomItemFooter"), discordUser)
		.setDescription(tr.format("randomItemDesc", {
			actualItem: itemToReplaceInstance.toString(language, null)
		}))
		.send(channel, (collector) => BlockingUtils.blockPlayerWithCollector(discordUser.id, BlockingConstants.REASONS.ACCEPT_ITEM, collector));
};

/**
 * Get the value of an item
 * @param item
 */
export const getItemValue = function(item: GenericItemModel): number {
	return Math.round(Constants.RARITIES_VALUES[item.rarity] + item.getItemAddedValue());
};

/**
 * Generates a random item given its category and the rarity limits
 * @param maxRarity
 * @param itemCategory
 * @param minRarity
 */
export const generateRandomItem = async function(maxRarity = Constants.RARITY.MYTHICAL, itemCategory: number = null, minRarity = Constants.RARITY.COMMON): Promise<GenericItemModel> {
	const rarity = generateRandomRarity(minRarity, maxRarity);
	if (itemCategory === null) {
		itemCategory = generateRandomItemCategory();
	}
	let itemsIds;
	switch (itemCategory) {
	case Constants.ITEM_CATEGORIES.WEAPON:
		itemsIds = await Weapons.getAllIdsForRarity(rarity);
		return await Weapons.getById(itemsIds[RandomUtils.draftbotRandom.integer(0, itemsIds.length - 1)].id);
	case Constants.ITEM_CATEGORIES.ARMOR:
		itemsIds = await Armors.getAllIdsForRarity(rarity);
		return await Armors.getById(itemsIds[RandomUtils.draftbotRandom.integer(0, itemsIds.length - 1)].id);
	case Constants.ITEM_CATEGORIES.POTION:
		itemsIds = await Potions.getAllIdsForRarity(rarity);
		return await Potions.getById(itemsIds[RandomUtils.draftbotRandom.integer(0, itemsIds.length - 1)].id);
	case Constants.ITEM_CATEGORIES.OBJECT:
		itemsIds = await ObjectItems.getAllIdsForRarity(rarity);
		return await ObjectItems.getById(itemsIds[RandomUtils.draftbotRandom.integer(0, itemsIds.length - 1)].id);
	default:
		return null;
	}
};

/**
 * Generate a random rarity. Legendary is very rare and common is not rare at all
 * @param {number} minRarity
 * @param {number} maxRarity
 * @return {Number} generated rarity
 */
export const generateRandomRarity = function(minRarity = Constants.RARITY.COMMON, maxRarity = Constants.RARITY.MYTHICAL): number {
	const randomValue = RandomUtils.draftbotRandom.integer(
		1 + (minRarity === Constants.RARITY.COMMON ? -1 : Constants.RARITIES_GENERATOR.VALUES[minRarity - 2]),
		Constants.RARITIES_GENERATOR.MAX_VALUE
		- (maxRarity === Constants.RARITY.MYTHICAL ? 0 : Constants.RARITIES_GENERATOR.MAX_VALUE
			- Constants.RARITIES_GENERATOR.VALUES[maxRarity - 1])
	);

	if (randomValue <= Constants.RARITIES_GENERATOR.VALUES[0]) {
		return Constants.RARITY.COMMON;
	}
	else if (randomValue <= Constants.RARITIES_GENERATOR.VALUES[1]) {
		return Constants.RARITY.UNCOMMON;
	}
	else if (randomValue <= Constants.RARITIES_GENERATOR.VALUES[2]) {
		return Constants.RARITY.EXOTIC;
	}
	else if (randomValue <= Constants.RARITIES_GENERATOR.VALUES[3]) {
		return Constants.RARITY.RARE;
	}
	else if (randomValue <= Constants.RARITIES_GENERATOR.VALUES[4]) {
		return Constants.RARITY.SPECIAL;
	}
	else if (randomValue <= Constants.RARITIES_GENERATOR.VALUES[5]) {
		return Constants.RARITY.EPIC;
	}
	else if (randomValue <= Constants.RARITIES_GENERATOR.VALUES[6]) {
		return Constants.RARITY.LEGENDARY;
	}
	return Constants.RARITY.MYTHICAL;
};

/**
 * Generate a random itemType
 * @return {Number}
 */
export const generateRandomItemCategory = function(): number {
	return RandomUtils.draftbotRandom.pick(Object.values(Constants.ITEM_CATEGORIES));
};

/**
 * Generate a random potion
 * @param {number} maxRarity
 * @param {number} potionType
 * @returns {Potions} generated potion
 */
export const generateRandomPotion = async function(potionType: number = null, maxRarity = Constants.RARITY.MYTHICAL): Promise<Potion> {
	if (potionType === null) {
		return this.generateRandomItem(maxRarity, Constants.ITEM_CATEGORIES.POTION);
	}
	const rarity = generateRandomRarity(Constants.RARITY.COMMON, maxRarity);
	return await Potions.randomItem(potionType, rarity);
};

/**
 * Generate a random object
 * @param {number} maxRarity
 * @param {number} objectType
 * @param minRarity
 * @returns {ObjectItem} generated object
 */
export const generateRandomObject = async function(objectType: number = null, minRarity = Constants.RARITY.COMMON, maxRarity = Constants.RARITY.MYTHICAL): Promise<GenericItemModel> {
	if (objectType === null) {
		return this.generateRandomItem(minRarity, maxRarity, Constants.ITEM_CATEGORIES.OBJECT);
	}
	const rarity = generateRandomRarity(minRarity, maxRarity);
	return await ObjectItems.randomItem(objectType, rarity);
};

/**
 * give a random item
 * @param {User} discordUser
 * @param {TextBasedChannel} channel
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {Entities} entity
 */
export const giveRandomItem = async function(discordUser: User, channel: TextBasedChannel, language: string, entity: Entity): Promise<void> {
	await giveItemToPlayer(entity, await generateRandomItem(), language, discordUser, channel);
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
	case Constants.ITEM_CATEGORIES.WEAPON:
		return Weapons;
	case Constants.ITEM_CATEGORIES.ARMOR:
		return Armors;
	case Constants.ITEM_CATEGORIES.POTION:
		return Potions;
	case Constants.ITEM_CATEGORIES.OBJECT:
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