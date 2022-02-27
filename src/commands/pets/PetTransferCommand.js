import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Entities} from "../../core/models/Entity";
import {GuildPets} from "../../core/models/GuildPet";
import {Guilds} from "../../core/models/Guild";
import {Servers} from "../../core/models/Server";
import {MissionsController} from "../../core/missions/MissionsController";

module.exports.commandInfo = {
	name: "pettransfer",
	aliases: ["pettr","ptr","ptransfer"],
	allowEffects: EFFECT.SMILEY
};

/**
 * Allow to transfer a pet
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const PetTransferCommand = async function(message, language, args) {
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}

	const [entity] = await Entities.getOrRegister(message.author.id);
	const pPet = entity.Player.Pet;

	let guild;
	try {
		guild = await Guilds.getById(entity.Player.guildId);
	}
	catch (error) {
		guild = null;
	}
	if (!guild) {
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.guildKick.getTranslation(language).notInAguild);
	}
	const guildPetCount = guild.GuildPets.length;
	const confirmEmbed = new DraftBotEmbed()
		.formatAuthor(JsonReader.commands.petTransfer.getTranslation(language).confirmSwitchTitle, message.author);
	const [server] = await Servers.getOrRegister(message.guild.id);

	if (args.length === 0) {
		if (!pPet) {
			return sendErrorMessage(message.author, message.channel, language, format(JsonReader.commands.petTransfer.getTranslation(language).noPetToTransfer, {
				prefix: server.prefix,
				cmd: "pettransfer",
				cmdShelter: "shelter"
			}));
		}
		if (pPet.isFeisty()) {
			return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.petTransfer.getTranslation(language).isFeisty);
		}
		if (guildPetCount >= JsonReader.models.pets.slots) {
			return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.petTransfer.getTranslation(language).noSlotAvailable);
		}
		entity.Player.petId = null;
		entity.Player.save();
		await (await GuildPets.addPet(guild.id, pPet.id)).save();
		confirmEmbed.setDescription(format(JsonReader.commands.petTransfer.getTranslation(language).confirmDeposit, {
			pet: pPet.getPetEmote() + " " + (pPet.nickname ? pPet.nickname : pPet.getPetTypeName(language))
		}));
		return message.channel.send({ embeds: [confirmEmbed] });
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
		if (pPet.isFeisty()) {
			return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.petTransfer.getTranslation(language).isFeisty);
		}
		swPet.petEntityId = pPet.id;
		await swPet.save();
	}
	else {
		await swPet.destroy();
	}
	entity.Player.petId = swPetEntity.id;
	await entity.Player.save();

	if (pPet) {
		confirmEmbed.setDescription(format(JsonReader.commands.petTransfer.getTranslation(language).confirmSwitch, {
			pet1: pPet.getPetEmote() + " " + (pPet.nickname ? pPet.nickname : pPet.getPetTypeName(language)),
			pet2: swPetEntity.getPetEmote() + " " + (swPetEntity.nickname ? swPetEntity.nickname : swPetEntity.getPetTypeName(language))
		}));
	}
	else {
		confirmEmbed.setDescription(format(JsonReader.commands.petTransfer.getTranslation(language).confirmFollows, {
			pet: swPetEntity.getPetEmote() + " " + (swPetEntity.nickname ? swPetEntity.nickname : swPetEntity.getPetTypeName(language))
		}));
	}
	await message.channel.send({ embeds: [confirmEmbed] });
	await MissionsController.update(entity.discordUserId, message.channel, language, "havePet");
	await MissionsController.update(entity.discordUserId, message.channel, language, "tamedPet", 1, { loveLevel: swPetEntity.getLoveLevelNumber() });
	await MissionsController.update(entity.discordUserId, message.channel, language, "trainedPet", 1, { loveLevel: swPetEntity.getLoveLevelNumber() });
};

module.exports.execute = PetTransferCommand;