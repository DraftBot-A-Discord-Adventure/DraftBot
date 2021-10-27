import {Entities} from "../../core/models/Entity";

module.exports.commandInfo = {
	name: "pettrade",
	aliases: ["ptrade"],
	allowEffects: EFFECT.SMILEY
};

/**
 * Allow to trade pets
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {DraftBotTradeMessage} from "../../core/messages/DraftBotTradeMessage";

const PetTradeCommand = async (message, language) => {
	let [trader1] = await Entities.getOrRegister(message.author.id);

	if (message.mentions.users.size === 0) {
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.petTrade.getTranslation(language).needMention);
	}
	if (message.mentions.users.first().id === message.author.id) {
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.petTrade.getTranslation(language).cantTradeSelf);
	}
	let [trader2] = await Entities.getOrRegister(message.mentions.users.first().id);
	if (await canPerformCommand(message, language, PERMISSION.ROLE.ALL,
		[EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED], trader2) !== true) {
		return;
	}
	if (await sendBlockedError(message.mentions.users.first(), message.channel, language)) {
		return;
	}

	let pet1 = trader1.Player.Pet;
	let pet2 = trader2.Player.Pet;
	if (!pet1) {
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.myPet.getTranslation(language).noPet);
	}
	if (!pet2) {
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.myPet.getTranslation(language).noPetOther);
	}
	if (pet1.lovePoints < PETS.LOVE_LEVELS[0] || pet2.lovePoints < PETS.LOVE_LEVELS[0]) {
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.myPet.getTranslation(language).isFeisty);
	}

	const tradeSuccessCallback = async () => {
		[trader1] = await Entities.getOrRegister(message.author.id);
		[trader2] = await Entities.getOrRegister(message.mentions.users.first().id);
		pet1 = trader1.Player.Pet;
		pet2 = trader2.Player.Pet;
		removeBlockedPlayer(trader1.discordUserId);
		removeBlockedPlayer(trader2.discordUserId);
		trader1.Player.petId = pet2.id;
		trader1.Player.save();
		trader2.Player.petId = pet1.id;
		trader2.Player.save();
		pet1.lovePoints = PETS.BASE_LOVE;
		pet2.lovePoints = PETS.BASE_LOVE;
		pet1.save();
		pet2.save();
		await message.channel.send({ embeds: [new DraftBotEmbed()
			.formatAuthor(JsonReader.commands.petTrade.getTranslation(language).tradeTitle, message.author)
			.setDescription(JsonReader.commands.petTrade.getTranslation(language).tradeSuccess)
		] });
	};

	const tradeRefusedCallback = async (tradeMessage) => {
		removeBlockedPlayer(message.author.id);
		removeBlockedPlayer(message.mentions.users.first().id);
		await sendErrorMessage(message.author, message.channel, language, format(JsonReader.commands.petTrade.getTranslation(language).tradeCanceled, {
			trader: tradeMessage.trader1Accepted === false ? message.author : message.mentions.users.first()
		}),true);
	};

	const tradeNoResponseCallback = async () => {
		removeBlockedPlayer(message.author.id);
		removeBlockedPlayer(message.mentions.users.first().id);
		await sendErrorMessage(message.author, message.channel, language, JsonReader.commands.petTrade.getTranslation(language).tradeCanceledTime, true);
	};

	const tradeMessage = new DraftBotTradeMessage(
		message.author,
		message.mentions.users.first(),
		tradeSuccessCallback,
		tradeRefusedCallback,
		tradeNoResponseCallback
	)
		.formatAuthor(JsonReader.commands.petTrade.getTranslation(language).tradeTitle, message.author)
		.setDescription(format(JsonReader.commands.petTrade.getTranslation(language).tradeDescription, {
			trader1: message.author,
			trader2: message.mentions.users.first()
		}))
		.setFooter(JsonReader.commands.petTrade.getTranslation(language).warningTradeReset)
		.addField(format(JsonReader.commands.petTrade.getTranslation(language).petOfTrader, {
			trader: await trader1.Player.getPseudo(language)
		}), await PetEntities.getPetDisplay(pet1, language), true)
		.addField(format(JsonReader.commands.petTrade.getTranslation(language).petOfTrader, {
			trader: await trader2.Player.getPseudo(language)
		}), await PetEntities.getPetDisplay(pet2, language), true)
		.send(message.channel);

	addBlockedPlayer(trader1.discordUserId, "petTrade", tradeMessage.collector);
	addBlockedPlayer(trader2.discordUserId, "petTrade", tradeMessage.collector);
};

module.exports.execute = PetTradeCommand;