import {DraftBotErrorEmbed} from "../../core/messages/DraftBotErrorEmbed";
import {Entities} from "../../core/models/Entity";

module.exports.commandInfo = {
	name: "sell",
	aliases: [],
	allowEffects: EFFECT.SMILEY
};

/**
 * Allow to exchange the object that is in the player backup slot within the one that is active
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {ChoiceItem, DraftBotListChoiceMessage} from "../../core/messages/DraftBotListChoiceMessage";
import {Constants} from "../../core/Constants";
import {Translations} from "../../core/Translations";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {countNbOfPotions, sortPlayerItemList} from "../../core/utils/ItemUtils";
import InventorySlot from "../../core/models/InventorySlot";
import {MissionsController} from "../../core/missions/MissionsController";

const SellCommand = async (message, language) => {
	let [entity] = await Entities.getOrRegister(message.author.id);
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}

	const tr = Translations.getModule("commands.sell", language);
	let toSellItems = entity.Player.InventorySlots.filter(slot => !slot.isEquipped() && slot.itemId !== 0);
	if (toSellItems.length === 0) {
		return message.channel.send({ embeds: [new DraftBotErrorEmbed(message.author, language, tr.get("noItemToSell"))] });
	}
	toSellItems = await sortPlayerItemList(toSellItems);

	const choiceItems = [];
	for (const item of toSellItems) {
		const itemInstance = await item.getItem();
		const name = itemInstance[language];
		const value = itemInstance.getCategory() === Constants.ITEM_CATEGORIES.POTION ? 0 : getItemValue(itemInstance);
		const itemObject = {
			name: itemInstance.getName(language),
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

	const sellEnd = async (validateMessage, item) => {
		removeBlockedPlayer(entity.discordUserId);
		if (validateMessage.isValidated()) {
			[entity] = await Entities.getOrRegister(entity.discordUserId);
			const money = item.value;
			await InventorySlot.destroy({
				where: {
					playerId: entity.Player.id,
					slot: item.slot,
					itemCategory: item.itemCategory
				}
			});
			await entity.Player.addMoney(entity, money, message.channel, language);
			await entity.Player.save();
			[entity] = await Entities.getOrRegister(entity.discordUserId);
			await MissionsController.update(entity.discordUserId, message.channel, language, "sellItemWithGivenCost",1,{itemCost: money});
			await MissionsController.update(entity.discordUserId, message.channel, language, "havePotions",countNbOfPotions(entity.Player),null,true);
			log(entity.discordUserId + " sold his item " + item.name + " (money: " + money + ")");
			if (money === 0) {
				return await message.channel.send({ embeds: [new DraftBotEmbed()
					.formatAuthor(tr.get("potionDestroyedTitle"), message.author)
					.setDescription(
						tr.format("potionDestroyedMessage", {
							item: item.name,
							frenchMasculine: item.frenchMasculine
						})
					)] });
			}
			return await message.channel.send({ embeds: [new DraftBotEmbed()
				.formatAuthor(tr.get("soldMessageTitle"), message.author)
				.setDescription(tr.format("soldMessage",
					{
						item: item.name,
						money: money
					}
				))] });
		}
		await sendErrorMessage(message.author, message.channel, language, tr.get("sellCanceled"), true);
	};

	const choiceMessage = new DraftBotListChoiceMessage(choiceItems, message.author.id, async (item) => {
		const validationMessage = await new DraftBotValidateReactionMessage(message.author, (msg) => sellEnd(msg, item))
			.formatAuthor(tr.get("sellTitle"), message.author);
		if (item.value !== 0) {
			validationMessage
				.setDescription(tr.format("confirmSell", {
					item: item.name,
					money: item.value
				}));
		}
		else {
			validationMessage
				.setDescription(tr.format("confirmThrowAway", {
					item: item.name
				}));
		}
		validationMessage.send(message.channel, (collector) => addBlockedPlayer(entity.discordUserId, "sell", collector));
	}, async (endMessage) => {
		if (endMessage.isCanceled()) {
			removeBlockedPlayer(entity.discordUserId);
			await sendErrorMessage(message.author, message.channel, language, tr.get("sellCanceled"), true);
		}
	})
		.formatAuthor(tr.get("titleChoiceEmbed"), message.author);
	choiceMessage.setDescription(tr.get("sellIndication") + "\n\n" + choiceMessage.description);
	choiceMessage.send(message.channel, (collector) => addBlockedPlayer(entity.discordUserId, "sell", collector));
};

module.exports.execute = SellCommand;