import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {TranslationModule, Translations} from "../../core/Translations";
import {ChoiceItem, DraftBotListChoiceMessage} from "../../core/messages/DraftBotListChoiceMessage";
import {Constants} from "../../core/Constants";
import {sortPlayerItemList} from "../../core/utils/ItemUtils";
import InventorySlot, {InventorySlots} from "../../core/database/game/models/InventorySlot";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import Player, {Players} from "../../core/database/game/models/Player";
import InventoryInfo, {InventoryInfos} from "../../core/database/game/models/InventoryInfo";
import {ItemConstants} from "../../core/constants/ItemConstants";
import {DraftbotInteraction} from "../../core/messages/DraftbotInteraction";

/**
 * Collect all the stored items and prepare them for the main embed
 * @param toSwitchItems
 * @param language
 */
async function buildSwitchChoiceItems(toSwitchItems: InventorySlot[], language: string): Promise<ChoiceItem[]> {
	const choiceItems = [];
	for (const item of toSwitchItems) {
		choiceItems.push(new ChoiceItem(
			(await item.getItem()).toString(language, null),
			item
		));
	}
	return choiceItems;
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
	} else {
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

/**
 * Call the switch function and send switch embed
 * @param player
 * @param interaction
 * @param tr
 * @param itemInventorySlot
 * @param invInfo
 * @param invSlots
 */
async function sendFinishSwitchEmbed(
	player: Player,
	interaction: DraftbotInteraction,
	tr: TranslationModule,
	itemInventorySlot: InventorySlot,
	invInfo: InventoryInfo,
	invSlots: InventorySlot[]
): Promise<void> {
	const itemProfileSlot = invSlots.filter(slot => slot.isEquipped() && slot.itemCategory === itemInventorySlot.itemCategory)[0];
	await switchItemSlots(itemProfileSlot, player, itemInventorySlot);
	await invInfo.save();
	const itemProfile = await itemProfileSlot.getItem();
	const itemInventory = await itemInventorySlot.getItem();
	let desc;

	if (itemProfile.id === 0) {
		desc = tr.format(itemProfile.getCategory() === ItemConstants.CATEGORIES.OBJECT ? "hasBeenEquippedAndDaily" : "hasBeenEquipped", {
			item: itemInventory.getName(tr.language),
			frenchMasculine: itemInventory.frenchMasculine
		});
	} else {
		desc = tr.format(itemProfile.getCategory() === ItemConstants.CATEGORIES.OBJECT ? "descAndDaily" : "desc", {
			item1: itemInventory.getName(tr.language),
			item2: itemProfile.getName(tr.language)
		});
	}
	const embed = new DraftBotEmbed()
		.formatAuthor(tr.get("title"), interaction.user)
		.setDescription(desc);

	interaction.replied ? await interaction.channel.send({embeds: [embed]}) : await interaction.reply({embeds: [embed]});
}

/**
 * Prepare and send the main embed with all the choices
 * @param choiceItems
 * @param interaction
 * @param player
 * @param tr
 * @param invInfo
 * @param profileSlots
 */
async function sendSwitchEmbed(
	choiceItems: ChoiceItem[],
	interaction: DraftbotInteraction,
	player: Player,
	tr: TranslationModule,
	invInfo: InventoryInfo,
	profileSlots: InventorySlot[]
): Promise<void> {

	const choiceMessage = new DraftBotListChoiceMessage(
		choiceItems,
		interaction.user.id,
		async (item: InventorySlot) => {
			await sendFinishSwitchEmbed((await Players.getOrRegister(interaction.user.id))[0], interaction, tr, item, invInfo, profileSlots);
		},
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
async function executeCommand(interaction: DraftbotInteraction, language: string, player: Player): Promise<void> {
	// Error if blocked
	if (await sendBlockedError(interaction, language)) {
		return;
	}

	// Translation variable
	const tr = Translations.getModule("commands.switch", language);
	const invInfo = await InventoryInfos.getOfPlayer(player.id);
	const profileSlots = await InventorySlots.getOfPlayer(player.id);

	// Get the items that can be switched or send an error if none
	let toSwitchItems = profileSlots.filter(slot => !slot.isEquipped() && slot.itemId !== 0);
	if (toSwitchItems.length === 0) {
		await replyErrorMessage(interaction, language, tr.get("noItemToSwitch"));
		return;
	}

	if (toSwitchItems.length === 1) {
		await sendFinishSwitchEmbed(player, interaction, tr, toSwitchItems[0], invInfo, profileSlots);
		return;
	}

	toSwitchItems = await sortPlayerItemList(toSwitchItems);

	// Build the choice items for the choice embed
	const choiceItems = await buildSwitchChoiceItems(toSwitchItems, language);

	// Send the choice embed
	await sendSwitchEmbed(choiceItems, interaction, player, tr, invInfo, profileSlots);
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