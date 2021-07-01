module.exports.help = {
	name: "sell",
	aliases: [],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED]
};

/**
 * Allow to exchange the object that is in the player backup slot within the one that is active
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {DraftBotValidateReactionMessage} from "../../core/messages/ValidateReactionMessage";

const SellCommand = async (message, language) => {
	let [entity] = await Entities.getOrRegister(message.author.id);

	if (!entity.Player.Inventory.hasItemToSell()) {
		await sendErrorMessage(message.author, message.channel, language, JsonReader.commands.sell.getTranslation(language).noItemToSell);
		return;
	}

	let backupItem = await entity.Player.Inventory.getBackupObject();

	const sellEnd = async (validateMessage) => {
		removeBlockedPlayer(entity.discordUserId);
		if (validateMessage.isValidated()) {
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

	const validationMessage = await new DraftBotValidateReactionMessage(message.author, sellEnd)
		.formatAuthor(JsonReader.commands.sell.getTranslation(language).sellTitle, message.author)
		.setDescription(format(JsonReader.commands.sell.getTranslation(language).confirmSell, {
			item: backupItem.getName(language),
			money: getItemValue(backupItem)
		}))
		.send(message.channel);

	addBlockedPlayer(entity.discordUserId, "sell", validationMessage.collector);
};

module.exports.execute = SellCommand;