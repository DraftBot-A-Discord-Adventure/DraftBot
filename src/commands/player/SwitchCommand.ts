import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {TranslationModule, Translations} from "../../core/Translations";
import {ChoiceItem, DraftBotListChoiceMessage} from "../../core/messages/DraftBotListChoiceMessage";
import {Constants} from "../../core/Constants";
import {sortPlayerItemList} from "../../core/utils/ItemUtils";
import {Entities, Entity} from "../../core/database/game/models/Entity";
import InventorySlot from "../../core/database/game/models/InventorySlot";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {CommandInteraction} from "discord.js";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {millisecondsToHours} from "../../core/utils/TimeUtils";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {DailyConstants} from "../../core/constants/DailyConstants";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import * as moment from "moment";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {SwitchConstants} from "../../core/constants/SwitchConstants";

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
 * @param entity
 * @param interaction
 */
function addDailyTimeBecauseSwitch(entity: Entity, interaction: CommandInteraction): void {
	const nextDailyDate = moment(entity.Player.InventoryInfo.lastDailyAt).add(DailyConstants.TIME_BETWEEN_DAILIES, "h"); // eslint-disable-line new-cap
	const timeToCheck = millisecondsToHours(nextDailyDate.valueOf() - interaction.createdAt.valueOf());
	const maxTime = DailyConstants.TIME_BETWEEN_DAILIES - SwitchConstants.TIME_ADDED_MULTIPLIER;
	if (timeToCheck < 0) {
		entity.Player.InventoryInfo.updateLastDailyAt();
		entity.Player.InventoryInfo.editDailyCooldown(-maxTime);
	}
	else if (timeToCheck < maxTime) {
		entity.Player.InventoryInfo.editDailyCooldown(SwitchConstants.TIME_ADDED_MULTIPLIER);
	}
	else {
		entity.Player.InventoryInfo.updateLastDailyAt();
	}
}

/**
 * Switch the 2 given items in the inventory
 * @param otherItem
 * @param entity
 * @param item
 */
async function switchItemSlots(otherItem: InventorySlot, entity: Entity, item: InventorySlot): Promise<void> {
	if (otherItem.itemId === 0) {
		await InventorySlot.destroy({
			where: {
				playerId: entity.Player.id,
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
				playerId: entity.Player.id,
				itemCategory: item.itemCategory,
				slot: item.slot
			}
		});
	}
	await InventorySlot.update({
		itemId: item.itemId
	}, {
		where: {
			playerId: entity.Player.id,
			itemCategory: otherItem.itemCategory,
			slot: otherItem.slot
		}
	});
}

type ItemForCallback = { item: InventorySlot, shortName: string, frenchMasculine: string }

/**
 * Callback of the switch command
 * @param entity
 * @param interaction
 * @param item
 * @param tr
 */
async function switchItemEmbedCallback(entity: Entity, interaction: CommandInteraction, item: ItemForCallback, tr: TranslationModule): Promise<void> {
	[entity] = await Entities.getOrRegister(interaction.user.id);
	if (item.item.itemCategory === Constants.ITEM_CATEGORIES.OBJECT) {
		addDailyTimeBecauseSwitch(entity, interaction);
	}
	const otherItem = entity.Player.InventorySlots.filter(slot => slot.isEquipped() && slot.itemCategory === item.item.itemCategory)[0];
	const otherItemInstance = await otherItem.getItem();
	await switchItemSlots(otherItem, entity, item.item);
	await entity.Player.InventoryInfo.save();
	let desc;
	if (otherItem.itemId === 0) {
		desc = tr.format(item.item.itemCategory === Constants.ITEM_CATEGORIES.OBJECT ? "hasBeenEquippedAndDaily" : "hasBeenEquipped", {
			item: item.shortName,
			frenchMasculine: item.frenchMasculine
		});
	}
	else {
		desc = tr.format(item.item.itemCategory === Constants.ITEM_CATEGORIES.OBJECT ? "descAndDaily" : "desc", {
			item1: item.shortName,
			item2: otherItemInstance.getName(tr.language)
		});
	}
	await interaction.channel.send({
		embeds: [new DraftBotEmbed()
			.formatAuthor(tr.get("title"), interaction.user)
			.setDescription(desc)
		]
	});
}

/**
 * Prepare and send the main embed with all the choices
 * @param choiceItems
 * @param interaction
 * @param entity
 * @param tr
 */
async function sendSwitchEmbed(choiceItems: ChoiceItem[], interaction: CommandInteraction, entity: Entity, tr: TranslationModule): Promise<void> {
	const choiceMessage = new DraftBotListChoiceMessage(
		choiceItems,
		interaction.user.id,
		async (item: ItemForCallback) => await switchItemEmbedCallback(entity, interaction, item, tr),
		async (endMessage) => {
			BlockingUtils.unblockPlayer(entity.discordUserId, BlockingConstants.REASONS.SWITCH);
			if (endMessage.isCanceled()) {
				await sendErrorMessage(interaction.user, interaction, tr.language, tr.get("canceled"), true);
			}
		});

	choiceMessage.formatAuthor(tr.get("switchTitle"), interaction.user);
	choiceMessage.setDescription(`${tr.get("switchIndication")}\n\n${choiceMessage.description}`);
	await choiceMessage.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(entity.discordUserId, BlockingConstants.REASONS.SWITCH, collector));
}

/**
 * Main function : Switch a main item with one of the inventory
 * @param interaction
 * @param language
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	// Error if blocked
	if (await sendBlockedError(interaction, language)) {
		return;
	}

	// Translation variable
	const tr = Translations.getModule("commands.switch", language);

	// Get the items that can be switched or send an error if none
	let toSwitchItems = entity.Player.InventorySlots.filter(slot => !slot.isEquipped() && slot.itemId !== 0);
	if (toSwitchItems.length === 0) {
		await replyErrorMessage(interaction, language, tr.get("noItemToSwitch"));
		return;
	}
	toSwitchItems = await sortPlayerItemList(toSwitchItems);

	// Build the choice items for the choice embed
	const choiceItems = await buildSwitchChoiceItems(toSwitchItems, language);

	// Send the choice embed
	await sendSwitchEmbed(choiceItems, interaction, entity, tr);
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("switch")
		.setDescription("Switch your equipped items"),
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