import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

const moment = require("moment");

module.exports.help = {
	name: "switch",
	aliases: ["sw"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED]
};

/**
 * Allow to exchange the object that is in the player backup slot within the one that is active
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const SwitchCommand = async (message, language) => {
	const [entity] = await Entities.getOrRegister(message.author.id);

	const nextDailyDate = new moment(entity.Player.Inventory.lastDailyAt).add(JsonReader.commands.daily.timeBetweenDailys, "h"); // eslint-disable-line new-cap
	const timeToCheck = millisecondsToHours(nextDailyDate.valueOf() - message.createdAt.getTime());
	const maxTime = JsonReader.commands.daily.timeBetweenDailys - JsonReader.commands.switch.timeToAdd;
	if (timeToCheck < 0) {
		entity.Player.Inventory.updateLastDailyAt();
		entity.Player.Inventory.editDailyCooldown(-maxTime);
	}
	else if (timeToCheck < maxTime) {
		entity.Player.Inventory.editDailyCooldown(JsonReader.commands.switch.timeToAdd);
	}
	else {
		entity.Player.Inventory.updateLastDailyAt();
	}


	const temp = entity.Player.Inventory.objectId;
	entity.Player.Inventory.objectId = entity.Player.Inventory.backupId;
	entity.Player.Inventory.backupId = temp;

	await entity.Player.Inventory.save();
	return await message.channel.send(new DraftBotEmbed()
		.formatAuthor(JsonReader.commands.switch.getTranslation(language).title, message.author)
		.setDescription(JsonReader.commands.switch.getTranslation(language).desc)
	);
};

module.exports.execute = SwitchCommand;