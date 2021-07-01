const Maps = require("../../core/Maps");

module.exports.help = {
	name: "daily",
	aliases: ["da"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED]
};

/**
 * Allow to use the object if the player has one in the dedicated slot of his inventory
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 */
const DailyCommand = async (message, language) => {
	const [entity] = await Entities.getOrRegister(message.author.id);

	const activeObject = await entity.Player.Inventory.getActiveObject();

	const embed = new discord.MessageEmbed();

	const time = millisecondsToHours(message.createdAt.getTime() - entity.Player.Inventory.lastDailyAt.valueOf());

	if (activeObject.nature === NATURE.NONE) {
		if (activeObject.id !== JsonReader.models.inventories.objectId) {
			// there is a object that do nothing in the inventory
			return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.daily.getTranslation(language).objectDoNothingError);
		}

		// there is no object in the inventory
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.daily.getTranslation(language).noActiveObjectdescription);

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

module.exports.execute = DailyCommand;