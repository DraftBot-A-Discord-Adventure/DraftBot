const tr = JsonReader.commands.petFeed;

/**
 * Feed your pet !
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const PetFeedCommand = async function(language, message) {
	const [entity] = await Entities.getOrRegister(message.author.id);
	let guild;
	try {
		guild = await Guilds.getById(entity.Player.guildId);
	}
	catch (error) {
		guild = null;
	}

	if (
		await canPerformCommand(
			message,
			language,
			PERMISSION.ROLE.ALL,
			[EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED],
			entity
		) !== true
	) {
		return;
	}

	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
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
		const foodItems = new Map()
			.set(GUILDSHOP.COMMON_FOOD, JsonReader.food.commonFood)
			.set(GUILDSHOP.HERBIVOROUS_FOOD, JsonReader.food.herbivorousFood)
			.set(GUILDSHOP.CARNIVOROUS_FOOD, JsonReader.food.carnivorousFood)
			.set(GUILDSHOP.ULTIMATE_FOOD, JsonReader.food.ultimateFood);

		const breedEmbed = new discord.MessageEmbed();
		breedEmbed.setAuthor(
			format(tr.getTranslation(language).breedEmbedAuthor, {
				author: message.author.username
			}),
			message.author.displayAvatarURL()
		);
		breedEmbed.setDescription(
			tr.getTranslation(language).breedEmbedDescription
		);

		const breedMsg = await message.channel.send(breedEmbed);

		const filterConfirm = (reaction, user) => user.id === entity.discordUserId && reaction.me;

		const collector = breedMsg.createReactionCollector(filterConfirm, {
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
					tr.getTranslation(language).cancelBreed,
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
			breedMsg.react(GUILDSHOP.COMMON_FOOD),
			breedMsg.react(GUILDSHOP.HERBIVOROUS_FOOD),
			breedMsg.react(GUILDSHOP.CARNIVOROUS_FOOD),
			breedMsg.react(GUILDSHOP.ULTIMATE_FOOD),
			breedMsg.react(MENU_REACTION.DENY)
		]);
	}
	else {
		const breedEmbed = new discord.MessageEmbed();
		breedEmbed.setAuthor(
			format(tr.getTranslation(language).breedEmbedTitle2, {
				author: message.author.username
			}),
			message.author.displayAvatarURL()
		);
		breedEmbed.setDescription(
			format(tr.getTranslation(language).breedEmbedDescription2, {
				petnick: await PetEntities.displayName(authorPet, language)
			})
		);
		breedEmbed.setFooter(tr.getTranslation(language).breedEmbedFooter);

		const breedMsg = await message.channel.send(breedEmbed);

		const filterConfirm = (reaction, user) => user.id === entity.discordUserId && reaction.me;

		const collector = breedMsg.createReactionCollector(filterConfirm, {
			time: COLLECTOR_TIME,
			max: 1
		});

		addBlockedPlayer(entity.discordUserId, "petFeed");

		// Fetch the choice from the user
		collector.on("end", async(reaction) => {
			removeBlockedPlayer(entity.discordUserId);
			if (
				!reaction.first() ||
				reaction.first().emoji.name === MENU_REACTION.DENY
			) {
				return sendErrorMessage(
					message.author,
					message.channel,
					language,
					tr.getTranslation(language).cancelBreed
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
			await Promise.all[authorPet.save(), entity.Player.save()];
			const feedSuccessEmbed = new discord.MessageEmbed();
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
			return message.channel.send(feedSuccessEmbed);
		});

		await Promise.all([
			breedMsg.react(MENU_REACTION.ACCEPT),
			breedMsg.react(MENU_REACTION.DENY)
		]);
	}
};

/**
 * Permet de nourrir un pet
 * @param {*} message - le message qui a lancé la commande
 * @param {fr/en} language la langue dans laquelle le message résultant est affiché
 * @param {*} entity - l'entité qui a lancé la commande
 * @param {*} pet - le pet à nourrir
 * @param {*} item - la nourriture à utiliser
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

	const successEmbed = new discord.MessageEmbed();

	successEmbed.setAuthor(
		format(tr.getTranslation(language).embedTitle, {
			pseudo: message.author.username
		}),
		message.author.displayAvatarURL()
	);
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
			console.log(pet);
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
	return message.channel.send(successEmbed);
}

module.exports = {
	commands: [
		{
			name: "petfeed",
			func: PetFeedCommand,
			aliases: [
				"feed",
				"pf",
				"petfeed",
				"pfeed",
				"feedp",
				"feedpet",
				"fp"
			]
		}
	]
};
