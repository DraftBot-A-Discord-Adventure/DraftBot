/**
 * Allow to transfer a pet
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const PetTransferCommand = async function (language, message, args) {
	const [entity] = await Entities.getOrRegister(message.author.id);
	const pPet = entity.Player.Pet;

	if (await canPerformCommand(message, language, PERMISSION.ROLE.ALL,
		[EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED], entity) !== true) {
		return;
	}
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}
	let guild;
	try {
		guild = await Guilds.getById(entity.Player.guild_id);
	} catch (error) {
		guild = null;
	}
	if (!guild) {
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.guildKick.getTranslation(language).notInAguild);
	}
	const guildPetCount = guild.GuildPets.length;
	const confirmEmbed = new discord.MessageEmbed();
	confirmEmbed.setAuthor(format(JsonReader.commands.petTransfer.getTranslation(language).confirmSwitchTitle, {
		pseudo: message.author.username
	}), message.author.displayAvatarURL());
	const [server] = await Servers.getOrRegister(message.guild.id);

	if (args.length === 0) {
		if (!pPet) {
			return sendErrorMessage(message.author, message.channel, language, format(JsonReader.commands.petTransfer.getTranslation(language).noPetToTransfer, {
				prefix: server.prefix,
				cmd: "pettransfer",
				cmdShelter: "shelter"
			}));
		}
		if (pPet.lovePoints < PETS.LOVE_LEVELS[0]) {
			return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.petTransfer.getTranslation(language).isFeisty);
		}
		if (guildPetCount >= JsonReader.models.pets.slots) {
			return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.petTransfer.getTranslation(language).noSlotAvailable);
		}
		entity.Player.pet_id = null;
		entity.Player.save();
		await (await GuildPets.addPet(guild.id, pPet.id)).save();
		confirmEmbed.setDescription(format(JsonReader.commands.petTransfer.getTranslation(language).confirmDeposit, {
			pet: PetEntities.getPetEmote(pPet) + " " + (pPet.nickname ? pPet.nickname : PetEntities.getPetTypeName(pPet, language))
		}));
		return message.channel.send(confirmEmbed);
	}

	if (guildPetCount === 0) {
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.guildShelter.getTranslation(language).noPetMessage);
	}

	if (args.length !== 1 || !RegExp(/^[0-9]*$/).test(args[0])) {
		return sendErrorMessage(message.author, message.channel, language, format(JsonReader.commands.petTransfer.getTranslation(language).correctUsage, {
			prefix: server.prefix,
			cmd: "pettransfer",
			cmdShelter: "shelter"
		}));
	}

	const petId = parseInt(args[0], 10);
	if (petId < 1 || petId > guildPetCount) {
		if (guildPetCount === 1) {
			return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.petTransfer.getTranslation(language).wrongPetNumberSingle);
		}
		return sendErrorMessage(message.author, message.channel, language, format(JsonReader.commands.petTransfer.getTranslation(language).wrongPetNumberBetween, {
			max: guildPetCount
		}));
	}

	const swPet = guild.GuildPets[petId - 1];
	const swPetEntity = swPet.PetEntity;

	if (pPet) {
		swPet.pet_entity_id = pPet.id;
		await swPet.save();
	} else {
		await swPet.destroy();
	}
	entity.Player.pet_id = swPetEntity.id;
	await entity.Player.save();

	if (pPet) {
		if (pPet.lovePoints < PETS.LOVE_LEVELS[0]) {
			return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.petTransfer.getTranslation(language).isFeisty);
		}
		confirmEmbed.setDescription(format(JsonReader.commands.petTransfer.getTranslation(language).confirmSwitch, {
			pet1: PetEntities.getPetEmote(pPet) + " " + (pPet.nickname ? pPet.nickname : PetEntities.getPetTypeName(pPet, language)),
			pet2: PetEntities.getPetEmote(swPetEntity) + " " + (swPetEntity.nickname ? swPetEntity.nickname : PetEntities.getPetTypeName(swPetEntity, language))
		}));
	} else {
		confirmEmbed.setDescription(format(JsonReader.commands.petTransfer.getTranslation(language).confirmFollows, {
			pet: PetEntities.getPetEmote(swPetEntity) + " " + (swPetEntity.nickname ? swPetEntity.nickname : PetEntities.getPetTypeName(swPetEntity, language))
		}));
	}
	return message.channel.send(confirmEmbed);
};

module.exports = {
	commands: [
		{
			name: "pettransfer",
			func: PetTransferCommand,
			aliases: ["pettr", "ptr", "ptransfer"]
		}
	]
};
