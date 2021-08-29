import {Collector, DMChannel, NewsChannel, TextChannel, User} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {ChoiceItem, DraftBotListChoiceMessage} from "../messages/DraftBotListChoiceMessage";
import {DraftBotValidateReactionMessage} from "../messages/DraftBotValidateReactionMessage";
import {Constants} from "../Constants";
import {format} from "./StringFormatter";

declare function log(s: string): void;
declare const InventorySlots: any;
declare const Entities: any;
declare const JsonReader: any;
declare function removeBlockedPlayer(id: string): void;
declare function addBlockedPlayer(id: string, reason: string, collector: Collector<any, any>): void;

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
	await channel.send(
		new DraftBotEmbed()
			.formatAuthor(tr.get("randomItemTitle"), discordUser)
			.setDescription(item.toString(language))
	);

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
			items.sort((a: any, b: any) => (a.slot > b.slot ? 1 : b.slot > a.slot ? -1 : 0));
			for (let item of items) {
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
			await choiceMessage.send(channel);
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
	await validateSell.send(channel);
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
		await channel.send(menuEmbed);
		item = itemToReplaceInstance;
		resaleMultiplier = resaleMultiplierActual;
	}
	if (item.getCategory() === Constants.ITEM_CATEGORIES.POTION) {
		await channel.send(
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
				)
		);
		return;
	}
	const money = Math.round(getItemValue(item) * resaleMultiplier);
	entity.Player.addMoney(money);
	await entity.Player.save();
	return await channel.send(
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
	);
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