/**
 * Allow to sell pet
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const PetSellCommand = async function (language, message, args) {
	let [entity] = await Entities.getOrRegister(message.author.id);
	let fields = [];
	let guild;
	let petCost;
	let pet;
	let sellInstance;

	const translations = JsonReader.commands.petSell.getTranslation(language);

	if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED], entity)) !== true) {
		return;
	}
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}

	try {
		guild = await Guilds.getById(entity.Player.guild_id);
	} catch (error) {
		guild = null;
	}

	if (guild == null) {
		// not in a guild
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.guildAdd.getTranslation(language).notInAguild
		);
	}
	if (!args[0]) return sendErrorMessage(message.author, message.channel, language, translations.needArgs);

	petCost = parseInt(args[0], 10);

	if (isNaN(petCost)) return sendErrorMessage(message.author, message.channel, language, translations.needNumber);

	pet = entity.Player.Pet;
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
				maxPrice: PETS.SELL.MAX,
			})
		);
	}

	fields.push({
		name: translations.petFieldName,
		value: format(JsonReader.commands.profile.getTranslation(language).pet.fieldValue, {
			rarity: Pets.getRarityDisplay(pet.PetModel),
			emote: PetEntities.getPetEmote(pet),
			nickname: pet.nickname ? pet.nickname : PetEntities.getPetTypeName(pet, language),
		}),
		inline: false,
	});

	const sellMessage = await message.channel.send(
		new discord.MessageEmbed()
			.setTitle(translations.sellMessage.title)
			.setDescription(
				format(translations.sellMessage.description, {
					author: message.author.username,
					price: petCost,
				})
			)
			.addFields(fields)
			.setFooter(translations.sellMessage.footer)
	);

	const filter = (reaction, user) => {
		return !user.bot;
	};

	const collector = sellMessage.createReactionCollector(filter, {
		time: COLLECTOR_TIME,
	});

	addBlockedPlayer(entity.discordUser_id, "petSell", collector);

	let spamCount = 0;
	let spammers = [];
	let buyer = null;
	collector.on("collect", async (reaction, user) => {
		switch (reaction.emoji.name) {
			case MENU_REACTION.ACCEPT:
				if (user.id === entity.discordUser_id) {
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
				if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY], buyer)) !== true) {
					buyer = null;
					return;
				}
				petSell(message, language, entity, user, pet, petCost);
				break;
			case MENU_REACTION.DENY:
				if (user.id === entity.discordUser_id) {
					await sendErrorMessage(user, message.channel, language, translations.sellCancelled, true);
				} else {
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

	collector.on("end", async function () {
		if (sellInstance === undefined) {
			global.removeBlockedPlayer(entity.discordUser_id);
			if (buyer == null) {
				sendErrorMessage(message.author, message.channel, language, translations.errors.noOneAvailable);
			}
		}
		if (sellInstance == null) {
			global.removeBlockedPlayer(entity.discordUser_id);
		}
	});

	await Promise.all([sellMessage.react(MENU_REACTION.ACCEPT), sellMessage.react(MENU_REACTION.DENY)]);
};

async function petSell(message, language, entity, user, pet, petCost) {
	const translations = JsonReader.commands.petSell.getTranslation(language);
	[buyer] = await Entities.getOrRegister(user.id);
	const guild = await Guilds.getById(entity.Player.guild_id);
	const confirmEmbed = new discord.MessageEmbed()
		.setAuthor(
			format(translations.confirmEmbed.author, {
				username: user.username,
			}),
			user.displayAvatarURL()
		)
		.setDescription(
			format(translations.confirmEmbed.description, {
				emote: await PetEntities.getPetEmote(pet),
				pet: (await pet.nickname) ? pet.nickname : PetEntities.getPetTypeName(pet, language),
				price: petCost,
			})
		);

	const confirmMessage = await message.channel.send(confirmEmbed);

	const confirmFilter = (reaction, user) => {
		return user.id === buyer.discordUser_id && reaction.me;
	};

	const confirmCollector = confirmMessage.createReactionCollector(confirmFilter, {
		time: COLLECTOR_TIME,
		max: 1,
	});

	addBlockedPlayer(buyer.discordUser_id, "petSellConfirm", confirmCollector);

	confirmCollector.on("end", async (reaction) => {
		if (!reaction.first() || reaction.first().emoji.name === MENU_REACTION.DENY) {
			removeBlockedPlayer(buyer.discordUser_id);
			return sendErrorMessage(user, message.channel, language, translations.sellCancelled, true);
		}
		if (reaction.first().emoji.name === MENU_REACTION.ACCEPT) {
			removeBlockedPlayer(buyer.discordUser_id);
			let buyerGuild;
			try {
				buyerGuild = await Guilds.getById(buyer.Player.guild_id);
			} catch (error) {
				buyerGuild = null;
			}
			if (buyerGuild && buyerGuild.id === guild.id) {
				return sendErrorMessage(user, message.channel, language, translations.sameGuild);
			}
			let buyerPet = buyer.Player.Pet;
			if (buyerPet) {
				return sendErrorMessage(user, message.channel, language, translations.havePet);
			}
			if (petCost > buyer.Player.money) return sendErrorMessage(user, message.channel, language, translations.noMoney);
			const MIN_XP = Math.floor(petCost / (1000 / 50));
			const MAX_XP = Math.floor(petCost / (1000 / 450));
			const toAdd = Math.floor(randInt(MIN_XP, MAX_XP));
			guild.addExperience(toAdd); //Add xp
			while (guild.needLevelUp()) {
				await guild.levelUpIfNeeded(message.channel, language);
			}
			await guild.save();
			buyer.Player.pet_id = pet.id;
			buyer.Player.money = buyer.Player.money - petCost;
			await buyer.Player.save();
			entity.Player.pet_id = null;
			await entity.Player.save();
			pet.lovePoints = PETS.BASE_LOVE;
			await pet.save();
			const guildXpEmbed = new discord.MessageEmbed();
			guildXpEmbed.setTitle(
				format(JsonReader.commands.guildDaily.getTranslation(language).rewardTitle, {
					guildName: guild.name,
				})
			);
			guildXpEmbed.setDescription(
				format(JsonReader.commands.guildDaily.getTranslation(language).guildXP, {
					xp: toAdd,
				})
			);
			const addPetEmbed = new discord.MessageEmbed();
			addPetEmbed.setAuthor(
				format(translations.addPetEmbed.author, {
					username: user.username,
				}),
				user.displayAvatarURL()
			);
			addPetEmbed.setDescription(
				format(translations.addPetEmbed.description, {
					emote: await PetEntities.getPetEmote(pet),
					pet: pet.nickname ? pet.nickname : PetEntities.getPetTypeName(pet, language),
				})
			);
			await message.channel.send(guildXpEmbed);
			return message.channel.send(addPetEmbed);
		}
	});
	await Promise.all([confirmMessage.react(MENU_REACTION.ACCEPT), confirmMessage.react(MENU_REACTION.DENY)]);
}

module.exports = {
	commands: [
		{
			name: "petsell",
			func: PetSellCommand,
			aliases: ["psell", "ps"],
		},
	],
};
