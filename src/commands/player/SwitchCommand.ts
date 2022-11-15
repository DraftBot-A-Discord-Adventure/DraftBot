import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {TranslationModule, Translations} from "../../core/Translations";
import {ChoiceItem, DraftBotListChoiceMessage} from "../../core/messages/DraftBotListChoiceMessage";
import {Constants} from "../../core/Constants";
import {sortPlayerItemList} from "../../core/utils/ItemUtils";
import InventorySlot, {InventorySlots} from "../../core/database/game/models/InventorySlot";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {CommandInteraction} from "discord.js";
import {ICommand} from "../ICommand";
import {millisecondsToHours} from "../../core/utils/TimeUtils";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {DailyConstants} from "../../core/constants/DailyConstants";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import * as moment from "moment";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {SwitchConstants} from "../../core/constants/SwitchConstants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import Player, {Players} from "../../core/database/game/models/Player";
import InventoryInfo, {InventoryInfos} from "../../core/database/game/models/InventoryInfo";
import {ItemConstants} from "../../core/constants/ItemConstants";
import {GenericItemModel} from "../../core/database/game/models/GenericItemModel";

/**
 * Collect all the stored items and prepare them for the main embed
 * @param toSwitchItems
 * @param language
 */
async function buildSwitchChoiceItems(toSwitchItems: InventorySlot[], language: string): Promise<ChoiceItem[]> {
	const choiceItems = [];
	for (const item of toSwitchItems) {
		const itemInstance = await item.getItem();
		const name = itemInstance.toString(language, null);
		choiceItems.push(new ChoiceItem(
			itemInstance.toString(language, null),
			{
				name: name,
				shortName: itemInstance.getName(language),
				item: item
			}
		));
	}
	return choiceItems;
}

/**
 * If needed, increase the time to wait for the next daily
 * @param interaction
 * @param invInfo
 */
function addDailyTimeBecauseSwitch(interaction: CommandInteraction, invInfo: InventoryInfo): void {
	const nextDailyDate = moment(invInfo.lastDailyAt).add(DailyConstants.TIME_BETWEEN_DAILIES, "h"); // eslint-disable-line new-cap
	const timeToCheck = millisecondsToHours(nextDailyDate.valueOf() - Date.now());
	const maxTime = DailyConstants.TIME_BETWEEN_DAILIES - SwitchConstants.TIME_ADDED_MULTIPLIER;
	if (timeToCheck < 0) {
		invInfo.updateLastDailyAt();
		invInfo.editDailyCooldown(-maxTime);
	}
	else if (timeToCheck < maxTime) {
		invInfo.editDailyCooldown(SwitchConstants.TIME_ADDED_MULTIPLIER);
	}
	else {
		invInfo.updateLastDailyAt();
	}
}

/**
 * Switch the 2 given items in the inventory
 * @param otherItem
 * @param player
 * @param item
 */
async function switchItemSlots(otherItem: InventorySlot, player: Player, item: InventorySlot): Promise<void> {
	if (otherItem.itemId === 0) {
		await InventorySlot.destroy({
			where: {
				playerId: player.id,
				itemCategory: item.itemCategory,
				slot: item.slot
			}
		});
	}
	else {
		await InventorySlot.update({
			itemId: otherItem.itemId
		}, {
			where: {
				playerId: player.id,
				itemCategory: item.itemCategory,
				slot: item.slot
			}
		});
	}
	await InventorySlot.update({
		itemId: item.itemId
	}, {
		where: {
			playerId: player.id,
			itemCategory: otherItem.itemCategory,
			slot: otherItem.slot
		}
	});
}

type ItemForCallback = { item: InventorySlot, shortName: string, frenchMasculine: string }

async function sendFinishSwitchEmbed(interaction: CommandInteraction, tr: TranslationModule, itemProfile: GenericItemModel, itemInventory : GenericItemModel): Promise<void> {
	let desc;
	if (itemProfile.id === 0) {
		desc = tr.format(itemProfile.getCategory() === ItemConstants.CATEGORIES.OBJECT ? "hasBeenEquippedAndDaily" : "hasBeenEquipped", {
			item: itemProfile.getName(tr.language),
			frenchMasculine: itemProfile.frenchMasculine
		});
	}
	else {
		desc = tr.format(itemProfile.getCategory() === ItemConstants.CATEGORIES.OBJECT ? "descAndDaily" : "desc", {
			item1: itemProfile.getName(tr.language),
			item2: itemInventory.getName(tr.language)
		});
	}
	const embed = new DraftBotEmbed()
		.formatAuthor(tr.get("title"), interaction.user)
		.setDescription(desc);

	interaction.replied ? await interaction.channel.send({embeds: [embed]}) : await interaction.reply({embeds: [embed]});
}

/**
 * Callback of the switch command
 * @param player
 * @param interaction
 * @param itemProfile
 * @param tr
 * @param invInfo
 * @param invSlots
 */
async function switchItemEmbedCallback(
	player: Player,
	interaction: CommandInteraction,
	itemProfile: ItemForCallback,
	tr: TranslationModule,
	invInfo: InventoryInfo,
	invSlots: InventorySlot[]
): Promise<void> {
	[player] = await Players.getOrRegister(interaction.user.id);
	if (itemProfile.item.itemCategory === ItemConstants.CATEGORIES.OBJECT) {
		addDailyTimeBecauseSwitch(interaction, invInfo);
	}
	const itemInventory = invSlots.filter(slot => slot.isEquipped() && slot.itemCategory === itemProfile.item.itemCategory)[0];
	await switchItemSlots(itemInventory, player, itemProfile.item);
	await invInfo.save();
	await sendFinishSwitchEmbed(interaction, tr, await itemProfile.item.getItem(), await itemInventory.getItem());
}

/**
 * Prepare and send the main embed with all the choices
 * @param choiceItems
 * @param interaction
 * @param player
 * @param tr
 * @param invInfo
 * @param invSlots
 */
async function sendSwitchEmbed(choiceItems: ChoiceItem[], interaction: CommandInteraction, player: Player, tr: TranslationModule, invInfo: InventoryInfo, invSlots: InventorySlot[]): Promise<void> {
	const choiceMessage = new DraftBotListChoiceMessage(
		choiceItems,
		interaction.user.id,
		async (item: ItemForCallback) => await switchItemEmbedCallback(player, interaction, item, tr, invInfo, invSlots),
		async (endMessage) => {
			BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.SWITCH);
			if (endMessage.isCanceled()) {
				await sendErrorMessage(interaction.user, interaction, tr.language, tr.get("canceled"), true);
			}
		});

	choiceMessage.formatAuthor(tr.get("switchTitle"), interaction.user);
	choiceMessage.setDescription(`${tr.get("switchIndication")}\n\n${choiceMessage.data.description}`);
	await choiceMessage.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.SWITCH, collector));
}

/**
 * Main function : Switch a main item with one of the inventory
 * @param interaction
 * @param language
 * @param player
 */
async function executeCommand(interaction: CommandInteraction, language: string, player: Player): Promise<void> {
	// Error if blocked
	if (await sendBlockedError(interaction, language)) {
		return;
	}

	// Translation variable
	const tr = Translations.getModule("commands.switch", language);
	const invInfo = await InventoryInfos.getOfPlayer(player.id);
	const invSlots = await InventorySlots.getOfPlayer(player.id);

	// Get the items that can be switched or send an error if none
	let toSwitchItems = invSlots.filter(slot => !slot.isEquipped() && slot.itemId !== 0);
	if (toSwitchItems.length === 0) {
		await replyErrorMessage(interaction, language, tr.get("noItemToSwitch"));
		return;
	}

	if (toSwitchItems.length === 1) {
		const itemInventory = invSlots.filter(slot => slot.isEquipped() && slot.itemCategory === toSwitchItems[0].itemCategory)[0];
		if (itemInventory.itemCategory === ItemConstants.CATEGORIES.OBJECT) {
			addDailyTimeBecauseSwitch(interaction, invInfo);
		}
		await switchItemSlots(itemInventory, player, toSwitchItems[0]);
		await invInfo.save();
		await sendFinishSwitchEmbed(interaction, tr, await toSwitchItems[0].getItem(), await itemInventory.getItem());
		return;
	}

	toSwitchItems = await sortPlayerItemList(toSwitchItems);

	// Build the choice items for the choice embed
	const choiceItems = await buildSwitchChoiceItems(toSwitchItems, language);

	// Send the choice embed
	await sendSwitchEmbed(choiceItems, interaction, player, tr, invInfo, invSlots);
}

const currentCommandFrenchTranslations = Translations.getModule("commands.switch", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.switch", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations),
	executeCommand,
	requirements: {
		allowEffects: null,
		requiredLevel: null,
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD, EffectsConstants.EMOJI_TEXT.LOCKED],
		guildPermissions: null,
		guildRequired: null,
		userPermission: null
	},
	mainGuildCommand: false,
	slashCommandPermissions: null
};