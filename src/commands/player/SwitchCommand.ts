import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {TranslationModule, Translations} from "../../core/Translations";
import {ChoiceItem, DraftBotListChoiceMessage} from "../../core/messages/DraftBotListChoiceMessage";
import {Constants} from "../../core/Constants";
import {sortPlayerItemList} from "../../core/utils/ItemUtils";
import {Entities, Entity} from "../../core/models/Entity";
import InventorySlot from "../../core/models/InventorySlot";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {CommandInteraction} from "discord.js";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {hoursToMilliseconds, millisecondsToHours} from "../../core/utils/TimeUtils";
import {Data} from "../../core/Data";
import {sendBlockedErrorInteraction, sendErrorMessage} from "../../core/utils/ErrorUtils";

/**
 * Collect all the stored items and prepare them for the main embed
 * @param toSwitchItems
 * @param language
 */
async function buildSwitchChoiceItems(toSwitchItems: InventorySlot[], language: string) {
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
function addDailyTimeBecauseSwitch(entity: Entity, interaction: CommandInteraction) {
	const dailyData = Data.getModule("commands.daily");
	const switchData = Data.getModule("commands.switch");
	const nextDailyDate = new Date().setDate(entity.Player.InventoryInfo.lastDailyAt.valueOf() + hoursToMilliseconds(dailyData.getNumber("timeBetweenDailies")));
	const timeToCheck = millisecondsToHours(nextDailyDate.valueOf() - interaction.createdAt.valueOf());
	const maxTime = dailyData.getNumber("timeBetweenDailies") - switchData.getNumber("timeToAdd");
	if (timeToCheck < 0) {
		entity.Player.InventoryInfo.updateLastDailyAt();
		entity.Player.InventoryInfo.editDailyCooldown(-maxTime);
	}
	else if (timeToCheck < maxTime) {
		entity.Player.InventoryInfo.editDailyCooldown(switchData.getNumber("timeToAdd"));
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
async function switchItemSlots(otherItem: InventorySlot, entity: Entity, item: InventorySlot) {
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
async function switchItemEmbedCallback(entity: Entity, interaction: CommandInteraction, item: ItemForCallback, tr: TranslationModule) {
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
	interaction.channel.send({
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
async function sendSwitchEmbed(choiceItems: ChoiceItem[], interaction: CommandInteraction, entity: Entity, tr: TranslationModule) {
	const choiceMessage = new DraftBotListChoiceMessage(
		choiceItems,
		interaction.user.id,
		async (item: ItemForCallback) => await switchItemEmbedCallback(entity, interaction, item, tr),
		async (endMessage) => {
			BlockingUtils.unblockPlayer(entity.discordUserId);
			if (endMessage.isCanceled()) {
				await sendErrorMessage(interaction.user, interaction.channel, tr.language, tr.get("canceled"), true);
			}
		});

	choiceMessage.formatAuthor(tr.get("switchTitle"), interaction.user);
	choiceMessage.setDescription(tr.get("switchIndication") + "\n\n" + choiceMessage.description);
	await choiceMessage.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(entity.discordUserId, "switch", collector));
}

/**
 * Main function : Switch a main item with one of the inventory
 * @param interaction
 * @param language
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity) {
	// Error if blocked
	if (await sendBlockedErrorInteraction(interaction, language)) {
		return;
	}

	// Translation variable
	const tr = Translations.getModule("commands.switch", language);

	// Get the items that can be switched or send an error if none
	let toSwitchItems = entity.Player.InventorySlots.filter(slot => !slot.isEquipped() && slot.itemId !== 0);
	if (toSwitchItems.length === 0) {
		sendErrorMessage(interaction.user, interaction.channel, language, tr.get("noItemToSwitch"), false, interaction);
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
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD, Constants.EFFECT.LOCKED],
		guildPermissions: null,
		guildRequired: null,
		userPermission: null
	},
	mainGuildCommand: false,
	slashCommandPermissions: null
};