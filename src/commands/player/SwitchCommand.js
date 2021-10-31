import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Translations} from "../../core/Translations";
import {DraftBotErrorEmbed} from "../../core/messages/DraftBotErrorEmbed";
import {ChoiceItem, DraftBotListChoiceMessage} from "../../core/messages/DraftBotListChoiceMessage";
import {Constants} from "../../core/Constants";
import {sortPlayerItemList} from "../../core/utils/ItemUtils";
import {Entities} from "../../core/models/Entity";
import InventorySlot from "../../core/models/InventorySlot";

const moment = require("moment");

module.exports.commandInfo = {
	name: "switch",
	aliases: ["sw", "equip"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD]
};

/**
 * Allow to exchange the object that is in the player backup slot within the one that is active
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const SwitchCommand = async (message, language) => {
	let [entity] = await Entities.getOrRegister(message.author.id);
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}

	const tr = Translations.getModule("commands.switch", language);
	let toSwitchItems = entity.Player.InventorySlots.filter(slot => !slot.isEquipped() && slot.itemId !== 0);
	if (toSwitchItems.length === 0) {
		return message.channel.send({ embeds: [new DraftBotErrorEmbed(message.author, language, tr.get("noItemToSwitch"))] });
	}
	toSwitchItems = await sortPlayerItemList(toSwitchItems);
	const choiceItems = [];
	for (const item of toSwitchItems) {
		const itemInstance = await item.getItem();
		const name = itemInstance.toString(language);
		choiceItems.push(new ChoiceItem(
			itemInstance.toString(language),
			{
				name: name,
				shortName: itemInstance.getName(language),
				item: item
			}
		));
	}
	const choiceMessage = new DraftBotListChoiceMessage(choiceItems, message.author.id, async (item) => {
		[entity] = await Entities.getOrRegister(message.author.id);
		if (item.item.itemCategory === Constants.ITEM_CATEGORIES.OBJECT) {
			const nextDailyDate = new moment(entity.Player.InventoryInfo.lastDailyAt).add(JsonReader.commands.daily.timeBetweenDailys, "h"); // eslint-disable-line new-cap
			const timeToCheck = millisecondsToHours(nextDailyDate.valueOf() - message.createdAt.getTime());
			const maxTime = JsonReader.commands.daily.timeBetweenDailys - JsonReader.commands.switch.timeToAdd;
			if (timeToCheck < 0) {
				entity.Player.InventoryInfo.updateLastDailyAt();
				entity.Player.InventoryInfo.editDailyCooldown(-maxTime);
			}
			else if (timeToCheck < maxTime) {
				entity.Player.InventoryInfo.editDailyCooldown(JsonReader.commands.switch.timeToAdd);
			}
			else {
				entity.Player.InventoryInfo.updateLastDailyAt();
			}
		}
		const otherItem = entity.Player.InventorySlots.filter(slot => slot.isEquipped() && slot.itemCategory === item.item.itemCategory)[0];
		const otherItemInstance = await otherItem.getItem();
		await Promise.all([
			otherItem.itemId === 0 ?
				InventorySlot.destroy({
					where: {
						playerId: entity.Player.id,
						itemCategory: item.item.itemCategory,
						slot: item.item.slot
					}
				})
				:
				InventorySlot.update({
					itemId: otherItem.itemId
				}, {
					where: {
						playerId: entity.Player.id,
						itemCategory: item.item.itemCategory,
						slot: item.item.slot
					}
				}),
			InventorySlot.update({
				itemId: item.item.itemId
			}, {
				where: {
					playerId: entity.Player.id,
					itemCategory: otherItem.itemCategory,
					slot: otherItem.slot
				}
			}),
			entity.Player.InventoryInfo.save()
		]);
		let desc;
		if (otherItem.itemId === 0) {
			desc = tr.format(item.item.itemCategory === Constants.ITEM_CATEGORIES.OBJECT ? "hasBeenEquippedAndDaily" : "hasBeenEquipped", {
				item: item.shortName
			});
		}
		else {
			desc = tr.format(item.item.itemCategory === Constants.ITEM_CATEGORIES.OBJECT ? "descAndDaily" : "desc", {
				item1: item.shortName,
				item2: otherItemInstance.getName(language)
			});
		}
		return message.channel.send({ embeds: [new DraftBotEmbed()
			.formatAuthor(tr.get("title"), message.author)
			.setDescription(desc)
		] });
	},
	async (endMessage) => {
		removeBlockedPlayer(entity.discordUserId);
		if (endMessage.isCanceled()) {
			await sendErrorMessage(message.author, message.channel, language, tr.get("canceled"), true);
		}
	})
		.formatAuthor(tr.get("switchTitle"), message.author);
	choiceMessage.setDescription(tr.get("switchIndication") + "\n\n" + choiceMessage.description);
	choiceMessage.send(message.channel);
	addBlockedPlayer(entity.discordUserId, "switch", choiceMessage.collector);
};

module.exports.execute = SwitchCommand;