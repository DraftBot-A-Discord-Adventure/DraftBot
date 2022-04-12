import {Entities, Entity} from "../../core/models/Entity";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../core/Constants";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {DraftBotErrorEmbed} from "../../core/messages/DraftBotErrorEmbed";
import {countNbOfPotions, getItemValue, sortPlayerItemList} from "../../core/utils/ItemUtils";
import {ChoiceItem, DraftBotListChoiceMessage} from "../../core/messages/DraftBotListChoiceMessage";
import InventorySlot from "../../core/models/InventorySlot";
import {MissionsController} from "../../core/missions/MissionsController";
import {GenericItemModel} from "../../core/models/GenericItemModel";


async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity) {
	if (await sendBlockedError(interaction.user, interaction.channel, language)) {
		return;
	}

	const tr = Translations.getModule("commands.sell", language);

	let toSellItems = entity.Player.InventorySlots.filter(slot => !slot.isEquipped() && slot.itemId !== 0);
	if (toSellItems.length === 0) {
		await interaction.reply({embeds: [new DraftBotErrorEmbed(interaction.user, language, tr.get("noItemToSell"))]});
		return;
	}
	toSellItems = await sortPlayerItemList(toSellItems);

	const choiceItems: ChoiceItem[] = [];
	for (const item of toSellItems) {
		await populateChoiceItems(item, language, choiceItems, tr);
	}

	await sendSellEmbed(choiceItems, interaction, entity, tr, language);
}

async function populateChoiceItems(item: InventorySlot, language: string, choiceItems: ChoiceItem[], tr: TranslationModule) {
	const itemInstance: GenericItemModel = await item.getItem();
	const name = itemInstance.getName(language);
	const value = itemInstance.getCategory() === Constants.ITEM_CATEGORIES.POTION ? 0 : getItemValue(itemInstance);
	const itemObject = {
		name: name,
		value,
		slot: item.slot,
		itemCategory: item.itemCategory
	};
	if (value !== 0) {
		choiceItems.push(new ChoiceItem(
			tr.format("sellField", {
				name, value, moneyIcon: Constants.REACTIONS.MONEY_ICON
			}), itemObject));
	}
	else {
		choiceItems.push(new ChoiceItem(
			tr.format("throwAwayField", {
				name, throwEmote: Constants.REACTIONS.TRASH
			}), itemObject));
	}
}

async function sendSellEmbed(choiceItems: ChoiceItem[], interaction: CommandInteraction, entity: Entity, tr: TranslationModule, language: string) {
	const choiceMessage = new DraftBotListChoiceMessage(
		choiceItems,
		interaction.user.id,
		async (item) => await sellEmbedCallback(entity, interaction, item, tr, language),
		async (endMessage) => {
			BlockingUtils.unblockPlayer(entity.discordUserId);
			if (endMessage.isCanceled()) {
				await sendErrorMessage(interaction.user, interaction.channel, tr.language, tr.get("sellCanceled"), true);
			}
		});

	choiceMessage.formatAuthor(tr.get("titleChoiceEmbed"), interaction.user);
	choiceMessage.setDescription(tr.get("sellIndication") + "\n\n" + choiceMessage.description);
	await choiceMessage.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(entity.discordUserId, "sell", collector));
}

async function sellEmbedCallback(entity: Entity, interaction: CommandInteraction, item: any, tr: TranslationModule, language: string) {
	[entity] = await Entities.getOrRegister(entity.discordUserId);
	const money = item.value;
	await InventorySlot.destroy({
		where: {
			playerId: entity.Player.id,
			slot: item.slot,
			itemCategory: item.itemCategory
		}
	});
	await entity.Player.addMoney(entity, money, interaction.channel, language);
	await entity.Player.save();
	[entity] = await Entities.getOrRegister(entity.discordUserId);
	await MissionsController.update(entity.discordUserId, interaction.channel, language, "sellItemWithGivenCost", 1, {itemCost: money});
	await MissionsController.update(entity.discordUserId, interaction.channel, language, "havePotions", countNbOfPotions(entity.Player), null, true);
	// TODO : refaire le système de log
	// log(entity.discordUserId + " sold his item " + item.name + " (money: " + money + ")");
	if (money === 0) {
		return await interaction.channel.send({
			embeds: [new DraftBotEmbed()
				.formatAuthor(tr.get("potionDestroyedTitle"), interaction.user)
				.setDescription(
					tr.format("potionDestroyedMessage", {
						item: item.name,
						frenchMasculine: item.frenchMasculine
					})
				)]
		});
	}
	return await interaction.channel.send({
		embeds: [new DraftBotEmbed()
			.formatAuthor(tr.get("soldMessageTitle"), interaction.user)
			.setDescription(tr.format("soldMessage",
				{
					item: item.name,
					money: money
				}
			))]
	});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("sell")
		.setDescription("Sell your items"),
	executeCommand,
	requirements: {
		allowEffects: [Constants.EFFECT.SMILEY],
		requiredLevel: null,
		disallowEffects: null,
		guildPermissions: null,
		guildRequired: null,
		userPermission: null
	},
	mainGuildCommand: false,
	slashCommandPermissions: null
};
