import {Entities, Entity} from "../../core/database/game/models/Entity";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../core/Constants";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {countNbOfPotions, getItemValue, sortPlayerItemList} from "../../core/utils/ItemUtils";
import {ChoiceItem, DraftBotListChoiceMessage} from "../../core/messages/DraftBotListChoiceMessage";
import InventorySlot from "../../core/database/game/models/InventorySlot";
import {MissionsController} from "../../core/missions/MissionsController";
import {GenericItemModel} from "../../core/database/game/models/GenericItemModel";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {NumberChangeReason} from "../../core/database/logs/LogsDatabase";
import {draftBotInstance} from "../../core/bot";
import {EffectsConstants} from "../../core/constants/EffectsConstants";

type ItemObject = { name: string, frenchMasculine: boolean, value: number, slot: number, itemCategory: number };
type ItemObjectBase = { name: string, value: number, itemObject: ItemObject }

/**
 * transform an item to an itemObject
 * @param item
 * @param tr
 */
async function getItemObject(item: InventorySlot, tr: TranslationModule): Promise<ItemObjectBase> {
	const itemInstance: GenericItemModel = await item.getItem();
	const name = itemInstance.getName(tr.language);
	const value = itemInstance.getCategory() === Constants.ITEM_CATEGORIES.POTION ? 0 : getItemValue(itemInstance);
	const slot = item.slot;
	const itemCategory = item.itemCategory;
	const frenchMasculine = itemInstance.frenchMasculine;
	const itemObject: ItemObject = {name, frenchMasculine, value, slot, itemCategory};
	return {name, value, itemObject};
}

/**
 * transform an item slot to a choiceItem so that the item can be sold
 * @param item
 * @param choiceItems empty array
 * @param tr
 */
async function populateChoiceItems(item: InventorySlot, choiceItems: ChoiceItem[], tr: TranslationModule): Promise<void> {
	const itemObject = await getItemObject(item, tr);
	const value = itemObject.value;
	if (value !== 0) {
		choiceItems.push(new ChoiceItem(
			tr.format("sellField", {
				name: itemObject.name,
				value: value,
				moneyIcon: Constants.REACTIONS.MONEY_ICON
			}), itemObject.itemObject));
	}
	else {
		choiceItems.push(new ChoiceItem(
			tr.format("throwAwayField", {
				name: itemObject.name,
				throwEmote: Constants.REACTIONS.TRASH
			}), itemObject.itemObject));
	}
}

/**
 * catch the response from the user
 * @param entity
 * @param interaction
 * @param item the item that has been selected
 * @param tr
 */
function sellEmbedCallback(entity: Entity, interaction: CommandInteraction, item: ItemObject, tr: TranslationModule) {
	return async (validateMessage: DraftBotValidateReactionMessage): Promise<void> => {
		BlockingUtils.unblockPlayer(entity.discordUserId, BlockingConstants.REASONS.SELL_CONFIRM);
		if (!validateMessage.isValidated()) {
			await sendErrorMessage(
				interaction.user,
				interaction,
				tr.language,
				tr.get("sellCanceled"),
				true
			);
			return;
		}
		InventorySlot.findOne({
			where: {
				playerId: entity.Player.id,
				slot: item.slot,
				itemCategory: item.itemCategory
			}
		}).then(async item => await draftBotInstance.logsDatabase.logItemSell(entity.discordUserId, await item.getItem()));
		[entity] = await Entities.getOrRegister(entity.discordUserId);
		const money = item.value;
		await InventorySlot.destroy({
			where: {
				playerId: entity.Player.id,
				slot: item.slot,
				itemCategory: item.itemCategory
			}
		});
		await entity.Player.addMoney({
			entity,
			amount: money,
			channel: interaction.channel,
			language: tr.language,
			reason: NumberChangeReason.ITEM_SELL
		});
		await entity.Player.save();
		[entity] = await Entities.getOrRegister(entity.discordUserId);
		await MissionsController.update(entity, interaction.channel, tr.language, {
			missionId: "sellItemWithGivenCost",
			params: {itemCost: money}
		});
		await MissionsController.update(entity, interaction.channel, tr.language, {
			missionId: "havePotions",
			count: countNbOfPotions(entity.Player),
			set: true
		});
		if (money === 0) {
			await interaction.channel.send({
				embeds: [new DraftBotEmbed().formatAuthor(tr.get("potionDestroyedTitle"), interaction.user)
					.setDescription(
						tr.format("potionDestroyedMessage", {
							item: item.name,
							frenchMasculine: item.frenchMasculine
						})
					)]
			});
			return;
		}
		await interaction.channel.send({
			embeds: [new DraftBotEmbed().formatAuthor(tr.get("soldMessageTitle"), interaction.user)
				.setDescription(tr.format("soldMessage",
					{
						item: item.name,
						money
					}
				))]
		});
	};
}

/**
 * Ask the player confirmation
 * @param entity
 * @param interaction
 * @param item
 * @param tr
 */
async function itemChoiceValidation(entity: Entity, interaction: CommandInteraction, item: ItemObject, tr: TranslationModule): Promise<void> {
	BlockingUtils.unblockPlayer(entity.discordUserId, BlockingConstants.REASONS.SELL);
	await new DraftBotValidateReactionMessage(interaction.user, sellEmbedCallback(entity, interaction, item, tr))
		.formatAuthor(tr.get("sellTitle"), interaction.user)
		.setDescription(tr.format(item.itemCategory === Constants.ITEM_CATEGORIES.POTION ? "confirmThrowAway" : "confirmSell", {
			item: item.name,
			money: item.value
		}))
		.send(interaction.channel, (collector) => BlockingUtils.blockPlayerWithCollector(entity.discordUserId, BlockingConstants.REASONS.SELL_CONFIRM, collector));
}

/**
 * Sell menu embed
 * @param choiceItems
 * @param interaction
 * @param entity
 * @param tr
 */
async function sendSellEmbed(choiceItems: ChoiceItem[], interaction: CommandInteraction, entity: Entity, tr: TranslationModule): Promise<void> {
	const choiceMessage = new DraftBotListChoiceMessage(
		choiceItems,
		interaction.user.id,
		async (item: ItemObject) => await itemChoiceValidation(entity, interaction, item, tr),
		async (endMessage) => {
			BlockingUtils.unblockPlayer(entity.discordUserId, BlockingConstants.REASONS.SELL);
			if (endMessage.isCanceled()) {
				await sendErrorMessage(interaction.user, interaction, tr.language, tr.get("sellCanceled"), true);
			}
		});

	choiceMessage.formatAuthor(tr.get("titleChoiceEmbed"), interaction.user);
	choiceMessage.setDescription(`${tr.get("sellIndication")}\n\n${choiceMessage.description}`);
	await choiceMessage.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(entity.discordUserId, BlockingConstants.REASONS.SELL, collector));
}

/**
 * Allow a user to sell an item
 * @param interaction
 * @param language
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}

	const tr = Translations.getModule("commands.sell", language);

	let toSellItems = entity.Player.InventorySlots.filter(slot => !slot.isEquipped() && slot.itemId !== 0);
	if (toSellItems.length === 0) {
		await replyErrorMessage(interaction, language, tr.get("noItemToSell"));
		return;
	}
	toSellItems = await sortPlayerItemList(toSellItems);

	const choiceItems: ChoiceItem[] = [];
	for (const item of toSellItems) {
		await populateChoiceItems(item, choiceItems, tr);
	}

	await sendSellEmbed(choiceItems, interaction, entity, tr);
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("sell")
		.setDescription("Sell your items"),
	executeCommand,
	requirements: {
		allowEffects: [EffectsConstants.EMOJI_TEXT.SMILEY]
	},
	mainGuildCommand: false
};
