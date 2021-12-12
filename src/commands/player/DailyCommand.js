import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Entities} from "../../core/models/Entity";

import {Maps} from "../../core/Maps";

module.exports.commandInfo = {
	name: "daily",
	aliases: ["da"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD]
};

/**
 * Allow to use the object if the player has one in the dedicated slot of his inventory
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 */
const DailyCommand = async (message, language) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}
	const activeObject = await entity.Player.getMainObjectSlot().getItem();

	const time = millisecondsToHours(message.createdAt.getTime() - entity.Player.InventoryInfo.lastDailyAt.valueOf());

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
						JsonReader.commands.daily.timeBetweenDailys * 3600000 - message.createdAt.getTime() + entity.Player.InventoryInfo.lastDailyAt.valueOf()
					)
				)
			})
		);
	}

	const embed = new DraftBotEmbed()
		.formatAuthor(JsonReader.commands.daily.getTranslation(language).dailySuccess, message.author);

	if (activeObject.nature === NATURE.HEALTH) {
		embed.setDescription(
			format(JsonReader.commands.daily.getTranslation(language).healthDaily, {value: activeObject.power})
		);
		await entity.addHealth(activeObject.power);
		entity.Player.InventoryInfo.updateLastDailyAt();
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
		embed.setDescription(
			format(JsonReader.commands.daily.getTranslation(language).hospitalBonus, {
				value: minutesToString(activeObject.power * 60)
			})
		);
		Maps.advanceTime(entity.Player, activeObject.power * 60);
		await entity.Player.save();
		entity.Player.InventoryInfo.updateLastDailyAt();
	}
	if (activeObject.nature === NATURE.MONEY) {
		embed.setDescription(
			format(JsonReader.commands.daily.getTranslation(language).moneyBonus, {value: activeObject.power})
		);
		entity.Player.addMoney(entity, activeObject.power, message.channel, language);
		entity.Player.InventoryInfo.updateLastDailyAt();
	}

	await Promise.all([entity.save(), entity.Player.save(), entity.Player.InventoryInfo.save()]);
	log(entity.discordUserId + " used his daily item " + activeObject.en);
	return await message.channel.send({ embeds: [embed] });
};

module.exports.execute = DailyCommand;