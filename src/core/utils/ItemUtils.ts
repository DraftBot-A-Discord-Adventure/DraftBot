import {Collector, DMChannel, NewsChannel, TextChannel, User} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {ChoiceItem, DraftBotListChoiceMessage} from "../messages/DraftBotListChoiceMessage";
import {DraftBotValidateReactionMessage} from "../messages/DraftBotValidateReactionMessage";
import {Constants} from "../Constants";
import {format} from "./StringFormatter";
import {Random} from "random-js";
import {Armors} from "../models/Armor";

declare const InventorySlots: any;
declare const Entities: any;
declare const JsonReader: any;
declare function removeBlockedPlayer(id: string): void;
declare function addBlockedPlayer(id: string, reason: string, collector: Collector<any, any, any[]>): void;
declare const draftbotRandom: Random;
declare const Weapons: any;
declare const Potions: any;
declare const Objects: any;

// eslint-disable-next-line max-params
export const giveItemToPlayer = async function(
	entity: any,
	item: any,
	language: string,
	discordUser: User,
	channel: TextChannel | DMChannel | NewsChannel,
	resaleMultiplierNew = 1,
	resaleMultiplierActual = 1
): Promise<void> {
	const resaleMultiplier = resaleMultiplierNew;
	const tr = Translations.getModule("commands.inventory", language);
	await channel.send({ embeds: [
		new DraftBotEmbed()
			.formatAuthor(tr.get("randomItemTitle"), discordUser)
			.setDescription(item.toString(language))
	] });

	if (await entity.Player.giveItem(item) === true) {
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
					(await item.getItem()).toString(language),
					item
				));
			}
			const choiceMessage = await new DraftBotListChoiceMessage(
				choiceList,
				discordUser.id,
				async (replacedItem: any) => {
					[entity] = await Entities.getOrRegister(entity.discordUserId);
					removeBlockedPlayer(discordUser.id);
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
					removeBlockedPlayer(discordUser.id);
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
			choiceMessage.send(channel);
			addBlockedPlayer(discordUser.id, "acceptItem", choiceMessage.collector);
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
	const validateSell = new DraftBotValidateReactionMessage(
		discordUser,
		async (msg: DraftBotValidateReactionMessage) => {
			[entity] = await Entities.getOrRegister(entity.discordUserId);
			removeBlockedPlayer(discordUser.id);
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
			actualItem: itemToReplaceInstance.toString(language)
		})) as DraftBotValidateReactionMessage;
	validateSell.send(channel);
	addBlockedPlayer(discordUser.id, "acceptItem", validateSell.collector);
};

// eslint-disable-next-line max-params
const sellOrKeepItem = async function(
	entity: any,
	keepOriginal: boolean,
	discordUser: User,
	channel: TextChannel | DMChannel | NewsChannel,
	language: string,
	item: any,
	itemToReplace: any,
	itemToReplaceInstance: any,
	resaleMultiplier: number,
	resaleMultiplierActual: number,
	autoSell: boolean
) {
	const tr = Translations.getModule("commands.inventory", language);
	if (!keepOriginal) {
		const menuEmbed = new DraftBotEmbed();
		menuEmbed.formatAuthor(tr.get("acceptedTitle"), discordUser)
			.setDescription(item.toString(language));

		await InventorySlots.update(
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
		await channel.send({ embeds: [menuEmbed] });
		item = itemToReplaceInstance;
		resaleMultiplier = resaleMultiplierActual;
	}
	if (item.getCategory() === Constants.ITEM_CATEGORIES.POTION) {
		await channel.send({ embeds: [
			new DraftBotEmbed()
				.formatAuthor(
					autoSell ? JsonReader.commands.sell.getTranslation(language).soldMessageAlreadyOwnTitle
						: JsonReader.commands.sell.getTranslation(language).potionDestroyedTitle,
					discordUser)
				.setDescription(
					format(JsonReader.commands.sell.getTranslation(language).potionDestroyedMessage,
						{
							item: item.getName(language)
						}
					)
				)] }
		);
		return;
	}
	const money = Math.round(getItemValue(item) * resaleMultiplier);
	entity.Player.addMoney(money);
	await entity.Player.save();
	return await channel.send({ embeds: [
		new DraftBotEmbed()
			.formatAuthor(
				autoSell ? JsonReader.commands.sell.getTranslation(language).soldMessageAlreadyOwnTitle
					: JsonReader.commands.sell.getTranslation(language).soldMessageTitle,
				discordUser)
			.setDescription(
				format(JsonReader.commands.sell.getTranslation(language).soldMessage,
					{
						item: item.getName(language),
						money: money
					}
				)
			)
	] });
};

export const getItemValue = function(item: any) {
	let addedvalue;
	const category = item.getCategory();
	if (category === Constants.ITEM_CATEGORIES.POTION || category === Constants.ITEM_CATEGORIES.OBJECT) {
		addedvalue = parseInt(item.power);
	}
	if (category === Constants.ITEM_CATEGORIES.WEAPON) {
		addedvalue = parseInt(item.rawAttack);
	}
	if (category === Constants.ITEM_CATEGORIES.ARMOR) {
		addedvalue = parseInt(item.rawDefense);
	}
	return parseInt(JsonReader.values.raritiesValues[item.rarity]) + addedvalue;
};

export const generateRandomItem = async function(maxRarity = 8, itemCategory: number = null): Promise<any> {
	const rarity = generateRandomRarity(maxRarity);
	if (itemCategory === null) {
		itemCategory = generateRandomItemCategory();
	}
	let itemsIds;
	switch (itemCategory) {
	case Constants.ITEM_CATEGORIES.WEAPON:
		itemsIds = await Weapons.getAllIdsForRarity(rarity);
		return await Weapons.findOne({
			where: {
				id: itemsIds[draftbotRandom.integer(0, itemsIds.length - 1)].id
			}
		});
	case Constants.ITEM_CATEGORIES.ARMOR:
		itemsIds = await Armors.getAllIdsForRarity(rarity);
		return await Armors.getById(itemsIds[draftbotRandom.integer(0, itemsIds.length - 1)].id);
	case Constants.ITEM_CATEGORIES.POTION:
		itemsIds = await Potions.getAllIdsForRarity(rarity);
		return await Potions.findOne({
			where: {
				id: itemsIds[draftbotRandom.integer(0, itemsIds.length - 1)].id
			}
		});
	case Constants.ITEM_CATEGORIES.OBJECT:
		itemsIds = await Objects.getAllIdsForRarity(rarity);
		return await Objects.findOne({
			where: {
				id: itemsIds[draftbotRandom.integer(0, itemsIds.length - 1)].id
			}
		});
	default:
		return null;
	}
};

/**
 * Generate a random rarity. Legendary is very rare and common is not rare at all
 * @param {number} maxRarity
 * @return {Number} generated rarity
 */
export const generateRandomRarity = function(maxRarity = Constants.RARITY.MYTHICAL): number {
	const randomValue = draftbotRandom.integer(0, JsonReader.values.raritiesGenerator.maxValue -
		(maxRarity === Constants.RARITY.MYTHICAL ? 0 : JsonReader.values.raritiesGenerator.maxValue - JsonReader.values.raritiesGenerator[maxRarity - 1]));

	if (randomValue <= JsonReader.values.raritiesGenerator["0"]) {
		return Constants.RARITY.COMMON;
	}
	else if (randomValue <= JsonReader.values.raritiesGenerator["1"]) {
		return Constants.RARITY.UNCOMMON;
	}
	else if (randomValue <= JsonReader.values.raritiesGenerator["2"]) {
		return Constants.RARITY.EXOTIC;
	}
	else if (randomValue <= JsonReader.values.raritiesGenerator["3"]) {
		return Constants.RARITY.RARE;
	}
	else if (randomValue <= JsonReader.values.raritiesGenerator["4"]) {
		return Constants.RARITY.SPECIAL;
	}
	else if (randomValue <= JsonReader.values.raritiesGenerator["5"]) {
		return Constants.RARITY.EPIC;
	}
	else if (randomValue <= JsonReader.values.raritiesGenerator["6"]) {
		return Constants.RARITY.LEGENDARY;
	}
	return Constants.RARITY.MYTHICAL;
};

/**
 * Generate a random itemType
 * @return {Number}
 */
export const generateRandomItemCategory = function() {
	return draftbotRandom.pick(Object.values(Constants.ITEM_CATEGORIES));
};

/**
 * Generate a random potion
 * @param {number} maxRarity
 * @param {number} potionType
 * @returns {Potions} generated potion
 */
export const generateRandomPotion = async function(potionType: number = null, maxRarity = 8) {
	if (potionType === null) {
		return this.generateRandomItem(maxRarity, Constants.ITEM_CATEGORIES.POTION);
	}
	const rarity = generateRandomRarity(maxRarity);
	return await Potions.randomItem(potionType, rarity);
};

/**
 * Generate a random object
 * @param {number} maxRarity
 * @param {number} objectType
 * @returns {Objects} generated object
 */
export const generateRandomObject = async function(objectType: number = null, maxRarity = 8) {
	if (objectType === null) {
		return this.generateRandomItem(maxRarity, Constants.ITEM_CATEGORIES.OBJECT);
	}
	const rarity = generateRandomRarity(maxRarity);
	return await Objects.randomItem(objectType, rarity);
};

/**
 * give a random item
 * @param {module:"discord.js".User} discordUser
 * @param {module:"discord.js".TextChannel} channel
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {Entities} entity
 */
export const giveRandomItem = async function(discordUser: User, channel: TextChannel | DMChannel | NewsChannel, language: string, entity: any) {
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