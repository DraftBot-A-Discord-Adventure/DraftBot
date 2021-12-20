import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

const tr = JsonReader.commands.petFeed;
module.exports.commandInfo = {
	name: "petfeed",
	aliases: ["feed", "pf", "pfeed", "feedp", "feedpet", "fp"],
	allowEffects: EFFECT.SMILEY
};


/**
 * Feed your pet !
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 */
const PetFeedCommand = async (message, language) => {
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}

	const [entity] = await Entities.getOrRegister(message.author.id);
	let guild;
	try {
		guild = await Guilds.getById(entity.Player.guildId);
	}
	catch (error) {
		guild = null;
	}

	const authorPet = entity.Player.Pet;

	if (!authorPet) {
		return await sendErrorMessage(
			message.author,
			message.channel,
			language,
			tr.getTranslation(language).noPet
		);
	}

	const cooldownTime =
		PETS.BREED_COOLDOWN * authorPet.PetModel.rarity -
		(new Date().getTime() - authorPet.hungrySince);
	if (cooldownTime > 0) {
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			format(tr.getTranslation(language).notHungry, {
				petnick: await PetEntities.displayName(authorPet, language)
			})
		);
	}

	if (guild) {
		await guildUserFeedPet(language, message, entity, authorPet);
	}
	else {
		await withoutGuildPetFeed(language, message, authorPet, entity);

	}
};

/**
 * Allow a user in a guild to give some food to his pet
 * @param language
 * @param message
 * @param entity
 * @param authorPet
 * @returns {Promise<void>}
 */
async function guildUserFeedPet(language, message, entity, authorPet) {
	const foodItems = new Map()
		.set(GUILDSHOP.COMMON_FOOD, JsonReader.food.commonFood)
		.set(GUILDSHOP.HERBIVOROUS_FOOD, JsonReader.food.herbivorousFood)
		.set(GUILDSHOP.CARNIVOROUS_FOOD, JsonReader.food.carnivorousFood)
		.set(GUILDSHOP.ULTIMATE_FOOD, JsonReader.food.ultimateFood);

	const feedEmbed = new DraftBotEmbed()
		.formatAuthor(tr.getTranslation(language).feedEmbedAuthor, message.author);
	feedEmbed.setDescription(
		tr.getTranslation(language).feedEmbedDescription
	);

	const feedMsg = await message.channel.send({ embeds: [feedEmbed] });

	const filterConfirm = (reaction, user) => user.id === entity.discordUserId && reaction.me;

	const collector = feedMsg.createReactionCollector({
		filter: filterConfirm,
		time: COLLECTOR_TIME,
		max: 1
	});

	addBlockedPlayer(entity.discordUserId, "petFeed");

	// Fetch the choice from the user
	collector.on("end", (reaction) => {
		if (
			!reaction.first() ||
			reaction.first().emoji.name === MENU_REACTION.DENY
		) {
			removeBlockedPlayer(entity.discordUserId);
			return sendErrorMessage(
				message.author,
				message.channel,
				language,
				tr.getTranslation(language).cancelFeed,
				true
			);
		}

		if (foodItems.has(reaction.first().emoji.name)) {
			const item = foodItems.get(reaction.first().emoji.name);
			removeBlockedPlayer(entity.discordUserId);
			feedPet(message, language, entity, authorPet, item);
		}
	});

	await Promise.all([
		feedMsg.react(GUILDSHOP.COMMON_FOOD),
		feedMsg.react(GUILDSHOP.HERBIVOROUS_FOOD),
		feedMsg.react(GUILDSHOP.CARNIVOROUS_FOOD),
		feedMsg.react(GUILDSHOP.ULTIMATE_FOOD),
		feedMsg.react(MENU_REACTION.DENY)
	]);
}

/**
 * Allow a user without guild to feed his pet with some candies
 * @param language
 * @param message
 * @param entity
 * @param authorPet
 * @returns {Promise<void>}
 */
async function withoutGuildPetFeed(language, message, authorPet, entity) {
	const feedEmbed = new DraftBotEmbed()
		.formatAuthor(tr.getTranslation(language).feedEmbedTitle2, message.author);
	feedEmbed.setDescription(
		format(tr.getTranslation(language).feedEmbedDescription2, {
			petnick: await PetEntities.displayName(authorPet, language)
		})
	);
	feedEmbed.setFooter(tr.getTranslation(language).feedEmbedFooter);

	const feedMsg = await message.channel.send({ embeds: [feedEmbed] });

	const filterConfirm = (reaction, user) => user.id === entity.discordUserId && reaction.me;

	const collector = feedMsg.createReactionCollector({
		filter: filterConfirm,
		time: COLLECTOR_TIME,
		max: 1
	});

	addBlockedPlayer(entity.discordUserId, "petFeed");

	// Fetch the choice from the user
	collector.on("end", async (reaction) => {
		removeBlockedPlayer(entity.discordUserId);
		if (
			!reaction.first() ||
			reaction.first().emoji.name === MENU_REACTION.DENY
		) {
			return sendErrorMessage(
				message.author,
				message.channel,
				language,
				tr.getTranslation(language).cancelFeed
			);
		}

		if (entity.Player.money - 20 < 0) {
			return sendErrorMessage(
				message.author,
				message.channel,
				language,
				tr.getTranslation(language).noMoney
			);
		}
		entity.Player.money -= 20;
		authorPet.hungrySince = Date();
		authorPet.lovePoints += JsonReader.food.commonFood.effect;
		if (authorPet.lovePoints > PETS.MAX_LOVE_POINTS) {
			authorPet.lovePoints = PETS.MAX_LOVE_POINTS;
		}
		await Promise.all([
			authorPet.save(),
			entity.Player.save()
		]);
		const feedSuccessEmbed = new DraftBotEmbed();
		if (language === LANGUAGE.FRENCH) {
			feedSuccessEmbed.description = format(tr.getTranslation(language).description["1"], {
				petnick: await PetEntities.displayName(
					authorPet,
					language
				),
				typeSuffix: authorPet.sex === PETS.FEMALE ? "se" : "x"
			});
		}
		else {
			feedSuccessEmbed.description = format(tr.getTranslation(language).description["1"], {
				petnick: await PetEntities.displayName(
					authorPet,
					language
				)
			});
		}
		return message.channel.send({ embeds: [feedSuccessEmbed] });
	});

	await Promise.all([
		feedMsg.react(MENU_REACTION.ACCEPT),
		feedMsg.react(MENU_REACTION.DENY)
	]);
}

/**
 * feed the pet
 * @param {*} message
 * @param {fr/en} language
 * @param {*} entity
 * @param {*} pet
 * @param {*} item
 */
async function feedPet(message, language, entity, pet, item) {
	const guild = await Guilds.getById(entity.Player.guildId);
	if (guild[item.type] <= 0) {
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			tr.getTranslation(language).notEnoughFood
		);
	}

	const successEmbed = new DraftBotEmbed()
		.formatAuthor(tr.getTranslation(language).embedTitle, message.author);
	if (
		pet.PetModel.diet &&
		(item.type === "herbivorousFood" || item.type === "carnivorousFood")
	) {
		if (item.type.includes(pet.PetModel.diet)) {
			pet.lovePoints += item.effect;
			if (pet.lovePoints > PETS.MAX_LOVE_POINTS) {
				pet.lovePoints = PETS.MAX_LOVE_POINTS;
			}
			guild[item.type]--;
			if (language === LANGUAGE.FRENCH) {
				successEmbed.setDescription(
					format(tr.getTranslation(language).description["2"], {
						petnick: await PetEntities.displayName(pet, language),
						typeSuffix: pet.sex === PETS.FEMALE ? "se" : "x"
					})
				);
			}
			else {
				successEmbed.setDescription(
					format(tr.getTranslation(language).description["2"], {
						petnick: await PetEntities.displayName(pet, language)
					})
				);
			}
		}
		else {
			guild[item.type]--;
			successEmbed.setDescription(
				format(tr.getTranslation(language).description["0"], {
					petnick: await PetEntities.displayName(pet, language)
				})
			);
		}
	}
	else {
		pet.lovePoints += item.effect;
		if (pet.lovePoints > PETS.MAX_LOVE_POINTS) {
			pet.lovePoints = PETS.MAX_LOVE_POINTS;
		}
		guild[item.type]--;
		switch (item.type) {
		case "commonFood":
			if (language === LANGUAGE.FRENCH) {
				successEmbed.setDescription(
					format(tr.getTranslation(language).description["1"], {
						petnick: await PetEntities.displayName(pet, language),
						typeSuffix: pet.sex === PETS.FEMALE ? "se" : "x"
					})
				);
			}
			else {
				successEmbed.setDescription(
					format(tr.getTranslation(language).description["1"], {
						petnick: await PetEntities.displayName(pet, language)
					})
				);
			}
			break;
		case "carnivorousFood":
		case "herbivorousFood":
			if (language === LANGUAGE.FRENCH) {
				successEmbed.setDescription(
					format(tr.getTranslation(language).description["2"], {
						petnick: await PetEntities.displayName(pet, language),
						typeSuffix: pet.sex === PETS.FEMALE ? "se" : "x"
					})
				);
			}
			else {
				successEmbed.setDescription(
					format(tr.getTranslation(language).description["2"], {
						petnick: await PetEntities.displayName(pet, language)
					})
				);
			}
			break;
		case "ultimateFood":
			successEmbed.setDescription(
				format(tr.getTranslation(language).description["3"], {
					petnick: await PetEntities.displayName(pet, language)
				})
			);
			break;
		default:
			break;
		}
	}
	pet.hungrySince = Date();
	await Promise.all([pet.save(), guild.save()]);
	return message.channel.send({ embeds: [successEmbed] });
}

module.exports.execute = PetFeedCommand;
