import {ICommand} from "../ICommand";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../core/Constants";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {countNbOfPotions, getItemValue, sortPlayerItemList} from "../../core/utils/ItemUtils";
import {ChoiceItem, DraftBotListChoiceMessage} from "../../core/messages/DraftBotListChoiceMessage";
import InventorySlot, {InventorySlots} from "../../core/database/game/models/InventorySlot";
import {MissionsController} from "../../core/missions/MissionsController";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {draftBotInstance} from "../../core/bot";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import Player, {Players} from "../../core/database/game/models/Player";
import {NumberChangeReason} from "../../core/constants/LogsConstants";
import {ItemConstants} from "../../core/constants/ItemConstants";
import {GenericItemModel} from "../../core/database/game/models/GenericItemModel";


/**
 * transform an item slot to a choiceItem so that the item can be sold
 * @param item
 * @param choiceItems empty array
 * @param tr
 */
async function populateChoiceItems(item: InventorySlot, choiceItems: ChoiceItem[], tr: TranslationModule): Promise<void> {
	const itemInstance = await item.getItem();
	if (item.itemCategory !== ItemConstants.CATEGORIES.POTION) {
		choiceItems.push(new ChoiceItem(
			tr.format("sellField", {
				name: itemInstance.getName(tr.language),
				value: getItemValue(itemInstance),
				moneyIcon: Constants.REACTIONS.MONEY_ICON
			}), item));
	}
	else {
		choiceItems.push(new ChoiceItem(
			tr.format("throwAwayField", {
				name: itemInstance.getName(tr.language),
				throwEmote: Constants.REACTIONS.TRASH
			}), item));
	}
}

/**
 * catch the response from the user
 * @param player
 * @param interaction
 * @param item the item that has been selected
 * @param tr
 * @param itemInstance
 */
function sellEmbedCallback(player: Player, interaction: CommandInteraction, tr: TranslationModule, item : InventorySlot, itemInstance : GenericItemModel) {
	return async (validateMessage: DraftBotValidateReactionMessage): Promise<void> => {
		BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.SELL_CONFIRM);
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
		await draftBotInstance.logsDatabase.logItemSell(player.discordUserId, itemInstance);
		[player] = await Players.getOrRegister(player.discordUserId);
		const money = item.itemCategory === ItemConstants.CATEGORIES.POTION ? 0 : getItemValue(itemInstance);
		await InventorySlot.destroy({
			where: {
				playerId: player.id,
				slot: item.slot,
				itemCategory: item.itemCategory
			}
		});
		await player.addMoney({
			amount: money,
			channel: interaction.channel,
			language: tr.language,
			reason: NumberChangeReason.ITEM_SELL
		});
		await player.save();
		[player] = await Players.getOrRegister(player.discordUserId);
		await MissionsController.update(player, interaction.channel, tr.language, {
			missionId: "sellItemWithGivenCost",
			params: {itemCost: money}
		});
		await MissionsController.update(player, interaction.channel, tr.language, {
			missionId: "havePotions",
			count: countNbOfPotions(await InventorySlots.getOfPlayer(player.id)),
			set: true
		});
		if (money === 0) {
			await interaction.channel.send({
				embeds: [new DraftBotEmbed().formatAuthor(tr.get("potionDestroyedTitle"), interaction.user)
					.setDescription(
						tr.format("potionDestroyedMessage", {
							item: itemInstance.getName(tr.language),
							frenchMasculine: itemInstance.frenchMasculine
						})
					)]
			});
			return;
		}
		await interaction.channel.send({
			embeds: [new DraftBotEmbed().formatAuthor(tr.get("soldMessageTitle"), interaction.user)
				.setDescription(tr.format("soldMessage",
					{
						item: itemInstance.getName(tr.language),
						money
					}
				))]
		});
	};
}

/**
 * Ask the player confirmation
 * @param player
 * @param interaction
 * @param tr
 * @param item
 * @param itemInstance
 */
async function itemChoiceValidation(player: Player, interaction: CommandInteraction, tr: TranslationModule, item: InventorySlot, itemInstance: GenericItemModel): Promise<void> {
	BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.SELL);
	const reactionMessage = await new DraftBotValidateReactionMessage(interaction.user, sellEmbedCallback(player, interaction, tr, item, itemInstance))
		.formatAuthor(tr.get("sellTitle"), interaction.user)
		.setDescription(tr.format(item.itemCategory === ItemConstants.CATEGORIES.POTION ? "confirmThrowAway" : "confirmSell", {
			item: itemInstance.getName(tr.language),
			money: getItemValue(itemInstance)
		}));
	interaction.replied ? await reactionMessage.send(interaction.channel, (collector) => BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.SELL_CONFIRM, collector
	)) : await reactionMessage.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.SELL_CONFIRM, collector
	));
}

/**
 * Sell menu embed
 * @param choiceItems
 * @param interaction
 * @param player
 * @param tr
 */
async function sendSellEmbed(choiceItems: ChoiceItem[], interaction: CommandInteraction, player: Player, tr: TranslationModule): Promise<void> {
	const choiceMessage = new DraftBotListChoiceMessage(
		choiceItems,
		interaction.user.id,
		async (item: InventorySlot) => await itemChoiceValidation(player, interaction, tr, item, await item.getItem()),
		async (endMessage) => {
			BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.SELL);
			if (endMessage.isCanceled()) {
				await sendErrorMessage(interaction.user, interaction, tr.language, tr.get("sellCanceled"), true);
			}
		});

	choiceMessage.formatAuthor(tr.get("titleChoiceEmbed"), interaction.user);
	choiceMessage.setDescription(`${tr.get("sellIndication")}\n\n${choiceMessage.data.description}`);
	await choiceMessage.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.SELL, collector));
}

/**
 * Allow a user to sell an item
 * @param interaction
 * @param language
 * @param player
 */
async function executeCommand(interaction: CommandInteraction, language: string, player: Player): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}

	const tr = Translations.getModule("commands.sell", language);
	const invSlots = await InventorySlots.getOfPlayer(player.id);
	let toSellItems = invSlots.filter(slot => !slot.isEquipped() && slot.itemId !== 0);
	if (toSellItems.length === 0) {
		await replyErrorMessage(interaction, language, tr.get("noItemToSell"));
		return;
	}

	if (toSellItems.length === 1) {
		await itemChoiceValidation(player, interaction, tr, toSellItems[0], await toSellItems[0].getItem());
		return;
	}

	toSellItems = await sortPlayerItemList(toSellItems);

	const choiceItems: ChoiceItem[] = [];
	for (const item of toSellItems) {
		await populateChoiceItems(item, choiceItems, tr);
	}
	await sendSellEmbed(choiceItems, interaction, player, tr);
}

const currentCommandFrenchTranslations = Translations.getModule("commands.sell", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.sell", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations),
	executeCommand,
	requirements: {
		allowEffects: [EffectsConstants.EMOJI_TEXT.SMILEY]
	},
	mainGuildCommand: false
};
