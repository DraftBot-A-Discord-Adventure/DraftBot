import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

const Maps = require("../../core/Maps");

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
	const [entity] = await Entities.getOrRegister(message.author.id);

	const potion = await entity.Player.Inventory.getPotion();
	const embed = new DraftBotEmbed()
		.formatAuthor(JsonReader.commands.drink.getTranslation(language).drinkSuccess, message.author);


	if (potion.nature === NATURE.NONE) {
		if (potion.id !== JsonReader.models.inventories.potionId) {
			await entity.Player.Inventory.drinkPotion();
			entity.Player.Inventory.save();
			await sendErrorMessage(message.author, message.channel, language, JsonReader.commands.drink.getTranslation(language).objectDoNothingError);
		}
		else {
			await sendErrorMessage(message.author, message.channel, language, JsonReader.commands.drink.getTranslation(language).noActiveObjectdescription);
		}
		return;
	}
	if (potion.nature === NATURE.HEALTH) {
		embed.setDescription(format(JsonReader.commands.drink.getTranslation(language).healthBonus, {value: potion.power}));
		await entity.addHealth(potion.power);
		entity.Player.Inventory.drinkPotion();
	}
	if (potion.nature === NATURE.SPEED || potion.nature === NATURE.DEFENSE || potion.nature === NATURE.ATTACK) { // Those objects are active only during fights
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.drink.getTranslation(language).objectIsActiveDuringFights);
	}
	if (potion.nature === NATURE.HOSPITAL) {
		embed.setDescription(format(JsonReader.commands.drink.getTranslation(language).hospitalBonus, {value: potion.power}));
		Maps.advanceTime(entity.Player, potion.power * 60);
		entity.Player.save();
		entity.Player.Inventory.drinkPotion();
	}
	if (potion.nature === NATURE.MONEY) {
		embed.setDescription(format(JsonReader.commands.drink.getTranslation(language).moneyBonus, {value: potion.power}));
		entity.Player.addMoney(potion.power);
		entity.Player.Inventory.drinkPotion();
	}

	await Promise.all([
		entity.save(),
		entity.Player.save(),
		entity.Player.Inventory.save()
	]);
	log(entity.discordUserId + " drank " + potion.en);
	return await message.channel.send(embed);
};

module.exports.execute = DrinkCommand;