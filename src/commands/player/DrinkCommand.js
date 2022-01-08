import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Entities} from "../../core/models/Entity";

import {Maps} from "../../core/Maps";
import {MissionsController} from "../../core/missions/MissionsController";
import {Tags} from "../../core/models/Tag";
import Potion from "../../core/models/Potion";
import {countNbOfPotions} from "../../core/utils/ItemUtils";

module.exports.commandInfo = {
	name: "drink",
	aliases: ["dr","glouglou"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD]
};

/**
 * Allow to use the potion if the player has one in the dedicated slot of his inventory
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 */
const DrinkCommand = async (message, language) => {
	let [entity] = await Entities.getOrRegister(message.author.id);
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}
	const potion = await entity.Player.getMainPotionSlot().getItem();
	const embed = new DraftBotEmbed()
		.formatAuthor(JsonReader.commands.drink.getTranslation(language).drinkSuccess, message.author);


	if (potion.nature === NATURE.NONE) {
		if (potion.id !== JsonReader.models.inventories.potionId) {
			await entity.Player.drinkPotion();
			await sendErrorMessage(message.author, message.channel, language, JsonReader.commands.drink.getTranslation(language).objectDoNothingError);
		}
		else {
			await sendErrorMessage(message.author, message.channel, language, JsonReader.commands.drink.getTranslation(language).noActiveObjectdescription);
			return;
		}
	}
	else if (potion.nature === NATURE.HEALTH) {
		embed.setDescription(format(JsonReader.commands.drink.getTranslation(language).healthBonus, {value: potion.power}));
		await entity.addHealth(potion.power);
		await entity.Player.drinkPotion();
	}
	else if (potion.nature === NATURE.SPEED || potion.nature === NATURE.DEFENSE || potion.nature === NATURE.ATTACK) { // Those objects are active only during fights
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.drink.getTranslation(language).objectIsActiveDuringFights);
	}
	else if (potion.nature === NATURE.HOSPITAL) {
		embed.setDescription(format(JsonReader.commands.drink.getTranslation(language).hospitalBonus, {value: potion.power}));
		Maps.advanceTime(entity.Player, potion.power * 60);
		entity.Player.save();
		await entity.Player.drinkPotion();
	}
	else if (potion.nature === NATURE.MONEY) {
		embed.setDescription(format(JsonReader.commands.drink.getTranslation(language).moneyBonus, {value: potion.power}));
		entity.Player.addMoney(entity, potion.power, message.channel, language);
		await entity.Player.drinkPotion();
	}
	await MissionsController.update(entity.discordUserId, message.channel, language, "drinkPotion");
	const tagsToVerify = await Tags.findTagsFromObject(potion.id, Potion.name);
	if (tagsToVerify) {
		for (let i = 0; i < tagsToVerify.length; i++) {
			await MissionsController.update(entity.discordUserId, message.channel, language, tagsToVerify[i].textTag, 1, {tags: tagsToVerify});
		}
	}
	await Promise.all([
		entity.save(),
		entity.Player.save()
	]);
	log(entity.discordUserId + " drank " + potion.en);
	[entity] = await Entities.getOrRegister(entity.discordUserId);
	await MissionsController.update(entity.discordUserId, message.channel, language, "havePotions",countNbOfPotions(entity.Player),null,true);
	return await message.channel.send({ embeds: [embed] });
};

module.exports.execute = DrinkCommand;