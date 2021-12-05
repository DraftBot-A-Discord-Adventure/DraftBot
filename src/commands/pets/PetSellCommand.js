import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Entities} from "../../core/models/Entity";
import {Guilds} from "../../core/models/Guild";

module.exports.commandInfo = {
	name: "petsell",
	aliases: ["psell", "ps"],
	allowEffects: EFFECT.SMILEY
};

/**
 * Allow to sell pet
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const PetSellCommand = async (message, language, args) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	const fields = [];
	let guild;
	let sellInstance;

	const translations = JsonReader.commands.petSell.getTranslation(language);

	try {
		guild = await Guilds.getById(entity.Player.guildId);
	}
	catch (error) {
		guild = null;
	}

	if (guild === null) {
		// not in a guild
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.guildAdd.getTranslation(language).notInAguild
		);
	}
	if (!args[0]) {
		return sendErrorMessage(message.author, message.channel, language, translations.needArgs);
	}

	const petCost = parseInt(args[0], 10);

	if (isNaN(petCost)) {
		return sendErrorMessage(message.author, message.channel, language, translations.needNumber);
	}

	const pet = entity.Player.Pet;
	if (!pet) {
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.myPet.getTranslation(language).noPet
		);
	}

	if (pet.lovePoints < PETS.LOVE_LEVELS[0]) {
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			format(translations.isFeisty)
		);
	}

	if (petCost < PETS.SELL.MIN || petCost > PETS.SELL.MAX) {
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			format(translations.badPrice, {
				minPrice: PETS.SELL.MIN,
				maxPrice: PETS.SELL.MAX
			})
		);
	}

	fields.push({
		name: translations.petFieldName,
		value: format(JsonReader.commands.profile.getTranslation(language).pet.fieldValue, {
			rarity: pet.PetModel.getRarityDisplay(),
			emote: pet.getPetEmote(),
			nickname: pet.nickname ? pet.nickname : pet.getPetTypeName(language)
		}),
		inline: false
	});

	const sellMessage = await message.channel.send({ embeds: [
		new DraftBotEmbed()
			.setTitle(translations.sellMessage.title)
			.setDescription(
				format(translations.sellMessage.description, {
					author: message.author.username,
					price: petCost
				})
			)
			.addFields(fields)
			.setFooter(translations.sellMessage.footer)] }
	);

	const filter = (reaction, user) => !user.bot;

	const collector = sellMessage.createReactionCollector({
		filter,
		time: COLLECTOR_TIME
	});

	addBlockedPlayer(entity.discordUserId, "petSell", collector);

	let spamCount = 0;
	const spammers = [];
	let buyer = null;
	collector.on("collect", async (reaction, user) => {
		switch (reaction.emoji.name) {
		case MENU_REACTION.ACCEPT:
			if (user.id === entity.discordUserId) {
				spamCount++;
				if (spamCount < 3) {
					sendErrorMessage(user, message.channel, language, translations.errors.canSellYourself);
					return;
				}
				sendErrorMessage(user, message.channel, language, translations.errors.spam);
				sellInstance = null;
				break;
			}
			[buyer] = await Entities.getOrRegister(user.id);
			if (buyer.Player.effect === EFFECT.BABY) {
				buyer = null;
				return;
			}
			petSell(message, language, entity, user, pet, petCost);
			break;
		case MENU_REACTION.DENY:
			if (user.id === entity.discordUserId) {
				await sendErrorMessage(user, message.channel, language, translations.sellCancelled, true);
			}
			else {
				if (spammers.includes(user.id)) {
					return;
				}
				spammers.push(user.id);
				sendErrorMessage(user, message.channel, language, translations.errors.onlyInitiator);
				return;
			}
			sellInstance = null;
			break;
		default:
			return;
		}
		collector.stop();
	});

	collector.on("end", function() {
		if (sellInstance === undefined) {
			global.removeBlockedPlayer(entity.discordUserId);
			if (buyer === null) {
				sendErrorMessage(message.author, message.channel, language, translations.errors.noOneAvailable);
			}
		}
		if (sellInstance === null) {
			global.removeBlockedPlayer(entity.discordUserId);
		}
	});

	await Promise.all([sellMessage.react(MENU_REACTION.ACCEPT), sellMessage.react(MENU_REACTION.DENY)]);
};

async function petSell(message, language, entity, user, pet, petCost) {
	const translations = JsonReader.commands.petSell.getTranslation(language);
	const [buyer] = await Entities.getOrRegister(user.id);
	const guild = await Guilds.getById(entity.Player.guildId);
	const confirmEmbed = new DraftBotEmbed()
		.formatAuthor(translations.confirmEmbed.author, user)
		.setDescription(
			format(translations.confirmEmbed.description, {
				emote: await pet.getPetEmote(),
				pet: await pet.nickname ? pet.nickname : pet.getPetTypeName(language),
				price: petCost
			})
		);

	const confirmMessage = await message.channel.send({ embeds: [confirmEmbed] });

	const confirmFilter = (reaction, user) => user.id === buyer.discordUserId && reaction.me;

	const confirmCollector = confirmMessage.createReactionCollector({
		filter: confirmFilter,
		time: COLLECTOR_TIME,
		max: 1
	});

	addBlockedPlayer(buyer.discordUserId, "petSellConfirm", confirmCollector);

	confirmCollector.on("end", async (reaction) => {
		if (!reaction.first() || reaction.first().emoji.name === MENU_REACTION.DENY) {
			removeBlockedPlayer(buyer.discordUserId);
			return sendErrorMessage(user, message.channel, language, translations.sellCancelled, true);
		}
		if (reaction.first().emoji.name === MENU_REACTION.ACCEPT) {
			removeBlockedPlayer(buyer.discordUserId);
			let buyerGuild;
			try {
				buyerGuild = await Guilds.getById(buyer.Player.guildId);
			}
			catch (error) {
				buyerGuild = null;
			}
			if (buyerGuild && buyerGuild.id === guild.id) {
				return sendErrorMessage(user, message.channel, language, translations.sameGuild);
			}
			const buyerPet = buyer.Player.Pet;
			if (buyerPet) {
				return sendErrorMessage(user, message.channel, language, translations.havePet);
			}
			if (petCost > buyer.Player.money) {
				return sendErrorMessage(user, message.channel, language, translations.noMoney);
			}
			const MIN_XP = Math.floor(petCost / (1000 / 50));
			const MAX_XP = Math.floor(petCost / (1000 / 450));
			const toAdd = Math.floor(randInt(MIN_XP, MAX_XP));
			guild.addExperience(toAdd); // Add xp
			while (guild.needLevelUp()) {
				await guild.levelUpIfNeeded(message.channel, language);
			}
			await guild.save();
			buyer.Player.petId = pet.id;
			buyer.Player.addMoney(-petCost, message.channel, language);
			await buyer.Player.save();
			entity.Player.petId = null;
			await entity.Player.save();
			pet.lovePoints = PETS.BASE_LOVE;
			await pet.save();
			const guildXpEmbed = new DraftBotEmbed();
			guildXpEmbed.setTitle(
				format(JsonReader.commands.guildDaily.getTranslation(language).rewardTitle, {
					guildName: guild.name
				})
			);
			guildXpEmbed.setDescription(
				format(JsonReader.commands.guildDaily.getTranslation(language).guildXP, {
					xp: toAdd
				})
			);
			const addPetEmbed = new DraftBotEmbed()
				.formatAuthor(translations.addPetEmbed.author, user);
			addPetEmbed.setDescription(
				format(translations.addPetEmbed.description, {
					emote: await pet.getPetEmote(),
					pet: pet.nickname ? pet.nickname : pet.getPetTypeName(language)
				})
			);
			await message.channel.send({ embeds: [guildXpEmbed] });
			return message.channel.send({ embeds: [addPetEmbed] });
		}
	});
	await Promise.all([confirmMessage.react(MENU_REACTION.ACCEPT), confirmMessage.react(MENU_REACTION.DENY)]);
}

module.exports.execute = PetSellCommand;