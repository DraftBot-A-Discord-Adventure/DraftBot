import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import Entity from "../../core/models/Entity";
import {GuildPets} from "../../core/models/GuildPet";
import {Guild, Guilds} from "../../core/models/Guild";
import {MissionsController} from "../../core/missions/MissionsController";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilder} from "@discordjs/builders";
import {replyErrorMessage, sendBlockedErrorInteraction} from "../../core/utils/ErrorUtils";
import {CommandInteraction} from "discord.js";
import {TranslationModule, Translations} from "../../core/Translations";
import {Data} from "../../core/Data";
import PetEntity from "../../core/models/PetEntity";

/**
 * Allow to transfer a pet
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	if (await sendBlockedErrorInteraction(interaction, language)) {
		return;
	}
	const petTransferModule = Translations.getModule("commands.petTransfer", language);
	const playerPet = entity.Player.Pet;

	const guild = await getGuildOfEntity(entity);
	if (!guild) {
		replyErrorMessage(interaction, language, Translations.getModule("commands.guildKick", language).get("notInAguild"));
		return;
	}

	const guildPetCount = guild.GuildPets.length;
	const confirmEmbed = new DraftBotEmbed()
		.formatAuthor(petTransferModule.get("confirmSwitchTitle"), interaction.user);

	const shelterPosition = interaction.options.getInteger("shelterposition");

	if (shelterPosition === null) {
		await transfertPetToGuild(interaction, language, petTransferModule, entity, guild, confirmEmbed);
		return;
	}

	if (guildPetCount === 0) {
		replyErrorMessage(interaction, language, Translations.getModule("commands.guildShelter", language).get("noPetMessage"));
		return;
	}
	if (shelterPosition > guildPetCount) {
		sendErrorInvalidPositionShelter(guildPetCount, interaction, language, petTransferModule);
		return;
	}

	const swPetEntity = await switchPets(guild, shelterPosition, interaction, language, petTransferModule, entity);
	if (swPetEntity === null) {
		return null;
	}

	setDescriptionPetTransferEmbed(playerPet, confirmEmbed, petTransferModule, language, swPetEntity);
	await interaction.reply({embeds: [confirmEmbed]});
	await updateMissionsOfEntity(entity, interaction, language, swPetEntity);
}

async function getGuildOfEntity(entity: Entity) {
	try {
		return await Guilds.getById(entity.Player.guildId);
	}
	catch (error) {
		return null;
	}
}

async function transfertPetToGuild(interaction: CommandInteraction, language: string, petTransferModule: TranslationModule, entity: Entity, guild: Guild, confirmEmbed: DraftBotEmbed) {
	const playerPet = entity.Player.Pet;
	const guildPetCount = guild.GuildPets.length;
	if (!playerPet) {
		return replyErrorMessage(interaction, language, petTransferModule.get("noPetToTransfer"));
	}
	if (playerPet.isFeisty()) {
		return replyErrorMessage(interaction, language, petTransferModule.get("isFeisty"));
	}
	if (guildPetCount >= Data.getModule("models.pets").getNumber("slots")) {
		return replyErrorMessage(interaction, language, petTransferModule.get("noSlotAvailable"));
	}
	entity.Player.petId = null;
	entity.Player.save();
	await (await GuildPets.addPet(guild.id, playerPet.id)).save();
	confirmEmbed.setDescription(petTransferModule.format("confirmDeposit", {
		pet: playerPet.getPetEmote() + " " + (playerPet.nickname ? playerPet.nickname : playerPet.getPetTypeName(language))
	}));
	return interaction.reply({embeds: [confirmEmbed]});
}

function sendErrorInvalidPositionShelter(guildPetCount: number, interaction: CommandInteraction, language: string, petTransferModule: TranslationModule) {
	if (guildPetCount === 1) {
		return replyErrorMessage(interaction, language, petTransferModule.get("wrongPetNumberSingle"));
	}
	return replyErrorMessage(interaction, language, petTransferModule.format("wrongPetNumberBetween", {
		max: guildPetCount
	}));
}

async function switchPets(guild: Guild, shelterPosition: any, interaction: CommandInteraction, language: string, petTransferModule: TranslationModule, entity: Entity) {
	const playerPet = entity.Player.Pet;
	const swPet = guild.GuildPets[shelterPosition - 1];
	const swPetEntity = swPet.PetEntity;

	if (playerPet) {
		if (playerPet.isFeisty()) {
			replyErrorMessage(interaction, language, petTransferModule.get("isFeisty"));
			return null;
		}
		swPet.petEntityId = playerPet.id;
		await swPet.save();
	}
	else {
		await swPet.destroy();
	}
	entity.Player.petId = swPetEntity.id;
	await entity.Player.save();
	return swPetEntity;
}

function setDescriptionPetTransferEmbed(playerPet: PetEntity, confirmEmbed: DraftBotEmbed, petTransferModule: TranslationModule, language: string, swPetEntity: PetEntity) {
	if (playerPet) {
		confirmEmbed.setDescription(petTransferModule.format("confirmSwitch", {
			pet1: playerPet.getPetEmote() + " " + (playerPet.nickname ? playerPet.nickname : playerPet.getPetTypeName(language)),
			pet2: swPetEntity.getPetEmote() + " " + (swPetEntity.nickname ? swPetEntity.nickname : swPetEntity.getPetTypeName(language))
		}));
	}
	else {
		confirmEmbed.setDescription(petTransferModule.format("confirmFollows", {
			pet: swPetEntity.getPetEmote() + " " + (swPetEntity.nickname ? swPetEntity.nickname : swPetEntity.getPetTypeName(language))
		}));
	}
}

async function updateMissionsOfEntity(entity: Entity, interaction: CommandInteraction, language: string, swPetEntity: PetEntity) {
	await MissionsController.update(entity.discordUserId, interaction.channel, language, "havePet");
	await MissionsController.update(entity.discordUserId, interaction.channel, language, "tamedPet", 1, {loveLevel: swPetEntity.getLoveLevelNumber()});
	await MissionsController.update(entity.discordUserId, interaction.channel, language, "trainedPet", 1, {loveLevel: swPetEntity.getLoveLevelNumber()});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("pettransfer")
		.setDescription("Leave your pet in the guild shelter and optionally take one back")
		.addIntegerOption(option => option.setName("shelterposition")
			.setDescription("The position of the pet in the shelter you want to switch with")
			.setRequired(false)
			.setMinValue(1)
			.setMaxValue(Data.getModule("models.pets").getNumber("slots"))
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		allowEffects: [Constants.EFFECT.SMILEY]
	},
	mainGuildCommand: false
};