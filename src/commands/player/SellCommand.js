/**
 * Allow to exchange the object that is in the player backup slot within the one that is active
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const SellCommand = async (language, message) => {
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
	const embed = new discord.MessageEmbed()
		.setColor(JsonReader.bot.embed.default)
		.setAuthor(format(JsonReader.commands.sell.getTranslation(language).sellTitle, {
			pseudo: message.author.username,
		}), message.author.displayAvatarURL())
		.setDescription(format(JsonReader.commands.sell.getTranslation(language).confirmSell, {
			item: backupItem.getName(language),
			money: getItemValue(backupItem),
		}));
	const sellMessage = await message.channel.send(embed);

	const filter = (reaction, user) => {
		return (reaction.emoji.name === MENU_REACTION.ACCEPT || reaction.emoji.name === MENU_REACTION.DENY) && user.id === message.author.id;
	};

	const collector = sellMessage.createReactionCollector(filter, {
		time: 30000,
		max: 1,
	});

	addBlockedPlayer(entity.discordUser_id, "sell", collector);

	collector.on("end", async (reaction) => {
		removeBlockedPlayer(entity.discordUser_id);
		if (reaction.first()) { // a reaction exist
			if (reaction.first().emoji.name === MENU_REACTION.ACCEPT) {
				[entity] = await Entities.getOrRegister(entity.discordUser_id);
				backupItem = await entity.Player.Inventory.getBackupObject();
				if (entity.Player.Inventory.hasItemToSell()) { // Preventive
					const money = getItemValue(backupItem);
					entity.Player.Inventory.backup_id = JsonReader.models.inventories.backup_id;
					entity.Player.money += money;
					await Promise.all([
						entity.Player.save(),
						entity.Player.Inventory.save()
					]);
					log(entity.discordUser_id + " sold his item " + backupItem.en + " (money: " + money + ")");
					return await message.channel.send(
						format(JsonReader.commands.sell.getTranslation(language).soldMessage,
							{
								item: backupItem.getName(language),
								money: money
							},
						));
				}
			}
		}
		await sendErrorMessage(message.author, message.channel, language, JsonReader.commands.sell.getTranslation(language).sellCanceled, true);
	});

	try {
		await Promise.all([
			sellMessage.react(MENU_REACTION.ACCEPT),
			sellMessage.react(MENU_REACTION.DENY),
		]);
	} catch (e) {
		log("Error while reaction to sell message: " + e);
	}
};

module.exports = {
	commands: [
		{
			name: "sell",
			func: SellCommand
		}
	]
};
