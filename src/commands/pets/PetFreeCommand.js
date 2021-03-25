/**
 * Allow to free a pet
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const PetFreeCommand = async function (language, message, args) {
	const [entity] = await Entities.getOrRegister(message.author.id);

	// search for a user's guild
	try {
		guild = await Guilds.getById(entity.Player.guild_id);
	} catch (error) {
		guild = null;
	}

	if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL,
		[EFFECT.BABY], entity)) !== true) {
		return;
	}
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}

	const pPet = entity.Player.Pet;
	if (!pPet) {
		return await sendErrorMessage(message.author, message.channel, language, JsonReader.commands.myPet.getTranslation(language).noPet);
	}

	const cooldownTime = PETS.FREE_COOLDOWN - (new Date().getTime() - entity.Player.last_pet_free);
	if (cooldownTime > 0) {
		return sendErrorMessage(message.author, message.channel, language, format(JsonReader.commands.petFree.getTranslation(language).cooldown, {
			time: minutesToString(millisecondsToMinutes(cooldownTime))
		}));
	}

	const confirmEmbed = new discord.MessageEmbed();
	const petField = PetEntities.getPetEmote(pPet) + " " + (pPet.nickname ? pPet.nickname : PetEntities.getPetTypeName(pPet, language));
	confirmEmbed.setAuthor(format(JsonReader.commands.petFree.getTranslation(language).successTitle, {
		pseudo: message.author.username
	}), message.author.displayAvatarURL());
	confirmEmbed.setDescription(format(JsonReader.commands.petFree.getTranslation(language).confirmDesc, {
		pet: petField
	}));

	const confirmMessage = await message.channel.send(confirmEmbed);

	const filter = (reaction, user) => {
		return ((reaction.emoji.name === MENU_REACTION.ACCEPT || reaction.emoji.name === MENU_REACTION.DENY) && user.id === message.author.id);
	};

	const collector = confirmMessage.createReactionCollector(filter, {
		time: 30000,
		max: 1,
	});

	addBlockedPlayer(entity.discordUser_id, "freepet", collector);

	collector.on('end', async (reaction) => {
		removeBlockedPlayer(entity.discordUser_id);
		if (reaction.first()) {
			if (reaction.first().emoji.name === MENU_REACTION.ACCEPT) {
				pPet.destroy();
				entity.Player.pet_id = null;
				entity.Player.last_pet_free = Date();
				entity.Player.save();
				const freedEmbed = new discord.MessageEmbed();
				freedEmbed.setAuthor(format(JsonReader.commands.petFree.getTranslation(language).successTitle, {
					pseudo: message.author.username
				}), message.author.displayAvatarURL());
				freedEmbed.setDescription(format(JsonReader.commands.petFree.getTranslation(language).petFreed, {
					pet: petField
				}));

				if (guild != null && guild["carnivorousFood"] + 1 <= JsonReader.commands.guildShop.max["carnivorousFood"] && draftbotRandom.realZeroToOneInclusive() <= 0.1) {
					guild["carnivorousFood"] = guild["carnivorousFood"] + 1;
					guild.save()
					freedEmbed.setDescription(freedEmbed.description + "\n\n" + format(JsonReader.commands.petFree.getTranslation(language).giveMeat, {
					}));
				}

				return await message.channel.send(freedEmbed);
			}
		}
		await sendErrorMessage(message.author, message.channel, language, JsonReader.commands.petFree.getTranslation(language).canceled);
	});

	try {
		await Promise.all([
			confirmMessage.react(MENU_REACTION.ACCEPT),
			confirmMessage.react(MENU_REACTION.DENY),
		]);
	} catch (e) {
	}
};

module.exports = {
	commands: [
		{
			name: 'petfree',
			func: PetFreeCommand,
			aliases: ['petf', 'pfree', 'freepet', 'freep']
		}
	]
};
