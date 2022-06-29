import {TextBasedChannel, User} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {ChoiceItem, DraftBotListChoiceMessage} from "../messages/DraftBotListChoiceMessage";
import {DraftBotValidateReactionMessage} from "../messages/DraftBotValidateReactionMessage";
import {Constants} from "../Constants";
import {format} from "./StringFormatter";
import {Armors} from "../models/Armor";
import {Weapons} from "../models/Weapon";
import Potion, {Potions} from "../models/Potion";
import {ObjectItems} from "../models/ObjectItem";
import Entity, {Entities} from "../models/Entity";
import InventorySlot from "../models/InventorySlot";
import {MissionsController} from "../missions/MissionsController";
import {GenericItemModel} from "../models/GenericItemModel";
import Player from "../models/Player";
import {BlockingUtils} from "./BlockingUtils";
import {RandomUtils} from "./RandomUtils";
import {BlockingConstants} from "../constants/BlockingConstants";
import {Tags} from "../models/Tag";

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

export const checkDrinkPotionMissions = async function(channel: TextBasedChannel, language: string, entity: Entity, potion: Potion) {
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
		return;
	}

	const category = item.getCategory();
	const maxSlots = entity.Player.InventoryInfo.slotLimitForCategory(category);
	let itemToReplace: any;
	let autoSell = false;
	if (maxSlots === 1) {
		itemToReplace = entity.Player.InventorySlots.filter((slot: { isEquipped: () => boolean; itemCategory: any; }) => slot.isEquipped() && slot.itemCategory === category)[0];
		autoSell = itemToReplace.itemId === item.id;
	}
	else if (maxSlots === 2) {
		itemToReplace = entity.Player.InventorySlots.filter((slot: { slot: number; itemCategory: any; }) => slot.slot === 1 && slot.itemCategory === category)[0];
		autoSell = itemToReplace.itemId === item.id;
	}
	else {
		const items = entity.Player.InventorySlots.filter((slot: { slot: number; itemCategory: any; isEquipped: () => boolean }) => slot.itemCategory === category && !slot.isEquipped());
		if (items.length === items.filter((slot: { itemId: any; }) => slot.itemId === item.id).length) {
			autoSell = true;
		}
		else {
			const choiceList: ChoiceItem[] = [];
			// eslint-disable-next-line @typescript-eslint/no-extra-parens
			items.sort((a: any, b: any) => (a.slot > b.slot ? 1 : b.slot > a.slot ? -1 : 0));
			for (const item of items) {
				choiceList.push(new ChoiceItem(
					(await item.getItem()).toString(language, null),
					item
				));
			}
			const choiceMessage = await new DraftBotListChoiceMessage(
				choiceList,
				discordUser.id,
				async (replacedItem: any) => {
					[entity] = await Entities.getOrRegister(entity.discordUserId);
					BlockingUtils.unblockPlayer(discordUser.id, BlockingConstants.REASONS.ACCEPT_ITEM);
					await sellOrKeepItem(
						entity,
						false,
						discordUser,
						channel,
						language,
						item,
						replacedItem,
						await replacedItem.getItem(),
						resaleMultiplier,
						resaleMultiplierActual,
						false
					);
				},
				async (endMessage: DraftBotListChoiceMessage) => {
					BlockingUtils.unblockPlayer(discordUser.id, BlockingConstants.REASONS.ACCEPT_ITEM);
					if (endMessage.isCanceled()) {
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
) {
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
		await channel.send({embeds: [menuEmbed]});
		item = itemToReplaceInstance;
		resaleMultiplier = resaleMultiplierActual;
	}
	const trSell = Translations.getModule("commands.sell", language);
	if (item.getCategory() === Constants.ITEM_CATEGORIES.POTION) {
		await channel.send({
			embeds: [
				new DraftBotEmbed()
					.formatAuthor(
						autoSell ? trSell.get("soldMessageAlreadyOwnTitle")
							: trSell.get("potionDestroyedTitle"),
						discordUser)
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
	await entity.Player.addMoney(entity, money, channel, language);
	await MissionsController.update(entity, channel, language, {
		missionId: "sellItemWithGivenCost",
		params: {itemCost: money}
	});
	await entity.Player.save();
	await channel.send({
		embeds: [
			new DraftBotEmbed()
				.formatAuthor(
					autoSell ? trSell.get("soldMessageAlreadyOwnTitle")
						: trSell.get("soldMessageTitle"),
					discordUser)
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

export const getItemValue = function(item: GenericItemModel): number {
	return Math.round(Constants.RARITIES_VALUES[item.rarity] + item.getItemAddedValue());
};

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
export const generateRandomItemCategory = function() {
	return RandomUtils.draftbotRandom.pick(Object.values(Constants.ITEM_CATEGORIES));
};

/**
 * Generate a random potion
 * @param {number} maxRarity
 * @param {number} potionType
 * @returns {Potions} generated potion
 */
export const generateRandomPotion = async function(potionType: number = null, maxRarity = Constants.RARITY.MYTHICAL) {
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
export const generateRandomObject = async function(objectType: number = null, minRarity = Constants.RARITY.COMMON, maxRarity = Constants.RARITY.MYTHICAL) {
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
export const giveRandomItem = async function(discordUser: User, channel: TextBasedChannel, language: string, entity: any) {
	const item = await generateRandomItem();
	return await giveItemToPlayer(entity, item, language, discordUser, channel);
};

/**
 * Sort an item slots list by type then price
 * @param items
 */
export const sortPlayerItemList = async function(items: any[]): Promise<any[]> {
	let itemInstances = await Promise.all(items.map(async function(e) {
		return [e, await e.getItem()];
	}));
	itemInstances = itemInstances.sort(
		(a: any, b: any) => {
			if (a[0].itemCategory < b[0].itemCategory) {
				return -1;
			}
			if (a[0].itemCategory > b[0].itemCategory) {
				return 1;
			}
			const aValue = getItemValue(a[1]);
			const bValue = getItemValue(b[1]);
			if (aValue > bValue) {
				return -1;
			}
			else if (aValue < bValue) {
				return 1;
			}
			return 0;
		}
	);
	return itemInstances.map(function(e) {
		return e[0];
	});
};

export const haveRarityOrMore = async function(slots: InventorySlot[], rarity: number): Promise<boolean> {
	for (const slot of slots) {
		if ((await slot.getItem()).rarity >= rarity) {
			return true;
		}
	}
	return false;
};
