const Maps = require("../../core/Maps");
/**
 * Allow to use the object if the player has one in the dedicated slot of his inventory
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 */
const DailyCommand = async function(language, message) {
	const [entity] = await Entities.getOrRegister(message.author.id);
	if (await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED], entity) !== true) {
		return;
	}

	const activeObject = await entity.Player.Inventory.getActiveObject();

	const embed = new discord.MessageEmbed();

	const time = millisecondsToHours(message.createdAt.getTime() - entity.Player.Inventory.lastDailyAt.valueOf());

	if (activeObject.nature === NATURE.NONE) {
		if (activeObject.id !== JsonReader.models.inventories.objectId) {
			// there is a object that do nothing in the inventory
			sendErrorMessage(message.author, message.channel, language, JsonReader.commands.daily.getTranslation(language).objectDoNothingError);
		}
		else {
			// there is no object in the inventory
			sendErrorMessage(message.author, message.channel, language, JsonReader.commands.daily.getTranslation(language).noActiveObjectdescription);
		}
		return;
	}

	if (time < JsonReader.commands.daily.timeBetweenDailys) {
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			format(JsonReader.commands.daily.getTranslation(language).coolDown, {
				coolDownTime: JsonReader.commands.daily.timeBetweenDailys,
				time: minutesToString(
					millisecondsToMinutes(
						JsonReader.commands.daily.timeBetweenDailys * 3600000 - message.createdAt.getTime() + entity.Player.Inventory.lastDailyAt.valueOf()
					)
				)
			})
		);
	}

	if (activeObject.nature === NATURE.HEALTH) {
		embed
			.setColor(JsonReader.bot.embed.default)
			.setAuthor(
				format(JsonReader.commands.daily.getTranslation(language).dailySuccess, { pseudo: message.author.username }),
				message.author.displayAvatarURL()
			)
			.setDescription(
				format(JsonReader.commands.daily.getTranslation(language).healthDaily, { value: activeObject.power })
			);
		await entity.addHealth(activeObject.power);
		entity.Player.Inventory.updateLastDailyAt();
	}
	if (
		activeObject.nature === NATURE.SPEED ||
		activeObject.nature === NATURE.DEFENSE ||
		activeObject.nature === NATURE.ATTACK
	) {
		// Those objects are active only during fights
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.daily.getTranslation(language).objectIsActiveDuringFights
		);
	}
	if (activeObject.nature === NATURE.HOSPITAL) {
		embed
			.setColor(JsonReader.bot.embed.default)
			.setAuthor(
				format(JsonReader.commands.daily.getTranslation(language).dailySuccess, { pseudo: message.author.username }),
				message.author.displayAvatarURL()
			)
			.setDescription(
				format(JsonReader.commands.daily.getTranslation(language).hospitalBonus, {
					value: minutesToString(activeObject.power * 60)
				})
			);
		Maps.advanceTime(entity.Player, activeObject.power * 60);
		await entity.Player.save();
		entity.Player.Inventory.updateLastDailyAt();
	}
	if (activeObject.nature === NATURE.MONEY) {
		embed
			.setColor(JsonReader.bot.embed.default)
			.setAuthor(
				format(JsonReader.commands.daily.getTranslation(language).dailySuccess, { pseudo: message.author.username }),
				message.author.displayAvatarURL()
			)
			.setDescription(
				format(JsonReader.commands.daily.getTranslation(language).moneyBonus, { value: activeObject.power })
			);
		entity.Player.addMoney(activeObject.power);
		entity.Player.Inventory.updateLastDailyAt();
	}

	await Promise.all([entity.save(), entity.Player.save(), entity.Player.Inventory.save()]);
	log(entity.discordUserId + " used his daily item " + activeObject.en);
	return await message.channel.send(embed);
};

module.exports = {
	commands: [
		{
			name: "daily",
			func: DailyCommand,
			aliases: ["da"]
		}
	]
};
