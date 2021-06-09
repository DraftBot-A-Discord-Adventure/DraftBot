/**
 * Allow to exchange the object that is in the player backup slot within the one that is active
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {ValidateReactionMessage} from "../../core/messages/ValidateReactionMessage";

const SellCommand = async(language, message) => {
	let [entity] = await Entities.getOrRegister(message.author.id);

	if (await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED], entity) !== true) {
		return;
	}
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}

	if (!entity.Player.Inventory.hasItemToSell()) {
		await sendErrorMessage(message.author, message.channel, language, JsonReader.commands.sell.getTranslation(language).noItemToSell);
		return;
	}

	let backupItem = await entity.Player.Inventory.getBackupObject();

	const sellEnd = async(msg) => {
		removeBlockedPlayer(entity.discordUserId);
		if (msg.isValidated()) {
			[entity] = await Entities.getOrRegister(entity.discordUserId);
			backupItem = await entity.Player.Inventory.getBackupObject();
			if (entity.Player.Inventory.hasItemToSell()) { // Preventive
				const money = getItemValue(backupItem);
				entity.Player.Inventory.backupId = JsonReader.models.inventories.backupId;
				entity.Player.money += money;
				await Promise.all([
					entity.Player.save(),
					entity.Player.Inventory.save()
				]);
				log(entity.discordUserId + " sold his item " + backupItem.en + " (money: " + money + ")");
				return await message.channel.send(
					format(JsonReader.commands.sell.getTranslation(language).soldMessage,
						{
							item: backupItem.getName(language),
							money: money
						}
					));
			}
		}
		await sendErrorMessage(message.author, message.channel, language, JsonReader.commands.sell.getTranslation(language).sellCanceled, true);
	};

	const validationMessage = await new ValidateReactionMessage(message.author, sellEnd)
		.setAuthor(format(JsonReader.commands.sell.getTranslation(language).sellTitle, {
			pseudo: message.author.username
		}), message.author.displayAvatarURL())
		.setDescription(format(JsonReader.commands.sell.getTranslation(language).confirmSell, {
			item: backupItem.getName(language),
			money: getItemValue(backupItem)
		}))
		.send(message.channel);

	addBlockedPlayer(entity.discordUserId, "sell", validationMessage.collector);
};

module.exports = {
	commands: [
		{
			name: "sell",
			func: SellCommand
		}
	]
};
