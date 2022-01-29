import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Entities} from "../../core/models/Entity";

import {Maps} from "../../core/Maps";
import {MissionsController} from "../../core/missions/MissionsController";
import {Tags} from "../../core/models/Tag";
import Potion from "../../core/models/Potion";
import {countNbOfPotions} from "../../core/utils/ItemUtils";
import {Constants} from "../../core/Constants";
import {Translations} from "../../core/Translations";
import {Data} from "../../core/Data";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";

module.exports.commandInfo = {
	name: "drink",
	aliases: ["dr","glouglou"],
	disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD]
};

const DrinkCommand = async (message, language, args) => {
	const tr = Translations.getModule("commands.drink", language);
	let [entity] = await Entities.getOrRegister(message.author.id);
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}
	const potion = await entity.Player.getMainPotionSlot().getItem();
	const embed = new DraftBotEmbed()
		.formatAuthor(tr.get("drinkSuccess"), message.author);

	if (potion.id === Data.getModule("models.inventories").getNumber("potionId")) {
		return sendErrorMessage(message.author, message.channel, language, tr.get("noActiveObjectdescription"));
	}
	if (potion.nature === NATURE.SPEED || potion.nature === NATURE.DEFENSE || potion.nature === NATURE.ATTACK) { // Those objects are active only during fights
		return sendErrorMessage(message.author, message.channel, language, tr.get("objectIsActiveDuringFights"));
	}

	const drinkPotion = async (validateMessage, potion) => {
		removeBlockedPlayer(entity.discordUserId);
		if (args[0] === "force" || args[0] === "f" || validateMessage.isValidated()) {
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
				await entity.addHealth(potion.power, message.channel, language);
				await entity.Player.drinkPotion();
			}
			else if (potion.nature === NATURE.SPEED || potion.nature === NATURE.DEFENSE || potion.nature === NATURE.ATTACK) { // Those objects are active only during fights
				return sendErrorMessage(message.author, message.channel, language, tr.get("objectIsActiveDuringFights"));
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
			await MissionsController.update(entity.discordUserId, message.channel, language, "havePotions", countNbOfPotions(entity.Player),null,true);
			return await message.channel.send({ embeds: [embed] });
		}
	};

	if (args[0] === "force" || args[0] === "f") {
		await drinkPotion(null, potion);
	}
	else {
		await new DraftBotValidateReactionMessage(message.author, (msg) => drinkPotion(msg, potion))
			.formatAuthor(tr.get("confirmationTitle"), message.author)
			.setDescription(tr.format("confirmation", {
				potion: potion[language],
				effect: potion.getNatureTranslation(language)
			}))
			.setFooter(tr.get("confirmationFooter"))
			.send(message.channel, (collector) => addBlockedPlayer(entity.discordUserId, "drink", collector));
	}
};

module.exports.execute = DrinkCommand;