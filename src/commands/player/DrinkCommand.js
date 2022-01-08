import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {Translations} from "../../core/Translations";

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
const DrinkCommand = async (message, language, args) => {
	const tr = Translations.getModule("commands.drink", language);
	const [entity] = await Entities.getOrRegister(message.author.id);
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}

	const potion = await entity.Player.getMainPotionSlot().getItem();
	const embed = new DraftBotEmbed()
		.formatAuthor(tr.get("drinkSuccess"), message.author);

	if (potion.nature === NATURE.NONE && potion.id === Translations.getModule("models.inventories", language).get("potionId")) {
		return sendErrorMessage(message.author, message.channel, language, tr.get("noActiveObjectdescription"));
	}
	if (potion.nature === NATURE.SPEED || potion.nature === NATURE.DEFENSE || potion.nature === NATURE.ATTACK) { // Those objects are active only during fights
		return sendErrorMessage(message.author, message.channel, language, tr.get("objectIsActiveDuringFights"));
	}
	const drinkPotion = async (validateMessage, potion) => {
		removeBlockedPlayer(entity.discordUserId);
		if (args[0] === "force" || args[0] === "f" || validateMessage.isValidated()) {
			if (potion.nature === NATURE.NONE) {
				await entity.Player.drinkPotion();
				return sendErrorMessage(message.author, message.channel, language, tr.get("objectDoNothingError"));
			}
			if (potion.nature === NATURE.HEALTH) {
				embed.setDescription(format(tr.get("healthBonus"), {value: potion.power}));
				await entity.addHealth(potion.power);
				await entity.Player.drinkPotion();
			}
			if (potion.nature === NATURE.HOSPITAL) {
				embed.setDescription(format(tr.get("hospitalBonus"), {value: potion.power}));
				Maps.advanceTime(entity.Player, potion.power * 60);
				entity.Player.save();
				await entity.Player.drinkPotion();
			}
			if (potion.nature === NATURE.MONEY) {
				embed.setDescription(format(tr.get("moneyBonus"), {value: potion.power}));
				entity.Player.addMoney(potion.power);
				await entity.Player.drinkPotion();
			}

			await Promise.all([
				entity.save(),
				entity.Player.save()
			]);
			log(entity.discordUserId + " drank " + potion.en);
			return await message.channel.send({ embeds: [embed] });
		}
		removeBlockedPlayer(entity.discordUserId);
		return sendErrorMessage(message.author, message.channel, language, tr.get("drinkCanceled"));
	}

	if (args[0] === "force" || args[0] === "f") {
		drinkPotion(null, potion);
	}
	else {
	const validationMessage = await new DraftBotValidateReactionMessage(message.author, (msg) => drinkPotion(msg, potion))
			.formatAuthor(tr.get("confirmationTitle"), message.author)
			.setDescription(tr.format("confirmation", {
				potion: potion[language],
				effect: potion.getNatureTranslation(language)
			}))
			.setFooter(tr.get("confirmationFooter"))
			.send(message.channel, (collector) => addBlockedPlayer(entity.discordUserId, "drink", collector));
	}
}

module.exports.execute = DrinkCommand;