import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import Entity from "../../core/database/game/models/Entity";
import {GuildPets} from "../../core/database/game/models/GuildPet";
import {Guild, Guilds} from "../../core/database/game/models/Guild";
import {MissionsController} from "../../core/missions/MissionsController";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {replyErrorMessage} from "../../core/utils/ErrorUtils";
import {CommandInteraction} from "discord.js";
import {TranslationModule, Translations} from "../../core/Translations";
import PetEntity from "../../core/database/game/models/PetEntity";
import {sendBlockedError} from "../../core/utils/BlockingUtils";
import {draftBotInstance} from "../../core/bot";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {PetEntityConstants} from "../../core/constants/PetEntityConstants";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

/**
 * Get the guild from a given entity
 * @param entity
 */
async function getGuildOfEntity(entity: Entity): Promise<Guild> {
	try {
		return await Guilds.getById(entity.Player.guildId);
	}
	catch (error) {
		return null;
	}
}

/**
 * Transfer your pet to the guild's shelter
 * @param interaction
 * @param petTransferModule
 * @param entity
 * @param guild
 * @param confirmEmbed
 */
async function transferPetToGuild(interaction: CommandInteraction, petTransferModule: TranslationModule, entity: Entity, guild: Guild, confirmEmbed: DraftBotEmbed): Promise<void> {
	const playerPet = entity.Player.Pet;
	const guildPetCount = guild.GuildPets.length;
	if (!playerPet) {
		return replyErrorMessage(interaction, petTransferModule.language, petTransferModule.format("noPetToTransfer", {}));
	}
	if (playerPet.isFeisty()) {
		return replyErrorMessage(interaction, petTransferModule.language, petTransferModule.get("isFeisty"));
	}
	if (guildPetCount >= PetEntityConstants.SLOTS) {
		return replyErrorMessage(interaction, petTransferModule.language, petTransferModule.get("noSlotAvailable"));
	}
	entity.Player.petId = null;
	await entity.Player.save();
	await GuildPets.addPet(guild, playerPet, false).save();
	confirmEmbed.setDescription(petTransferModule.format("confirmDeposit", {
		pet: `${playerPet.getPetEmote()} ${playerPet.nickname ? playerPet.nickname : playerPet.getPetTypeName(petTransferModule.language)}`
	}));
	draftBotInstance.logsDatabase.logPetTransfer(playerPet, null).then();
	await interaction.reply({embeds: [confirmEmbed]});
}

/**
 * Sends an error for an invalid pet position in the shelter
 * @param guildPetCount
 * @param interaction
 * @param language
 * @param petTransferModule
 */
async function sendErrorInvalidPositionShelter(guildPetCount: number, interaction: CommandInteraction, language: string, petTransferModule: TranslationModule): Promise<void> {
	if (guildPetCount === 1) {
		await replyErrorMessage(interaction, language, petTransferModule.get("wrongPetNumberSingle"));
		return;
	}
	await replyErrorMessage(interaction, language, petTransferModule.format("wrongPetNumberBetween", {
		max: guildPetCount
	}));
}

/**
 * Exchange a pet of a guild's member with one in the shelter
 * @param guild
 * @param shelterPosition
 * @param interaction
 * @param language
 * @param petTransferModule
 * @param entity
 */
async function switchPets(guild: Guild, shelterPosition: number, interaction: CommandInteraction, language: string, petTransferModule: TranslationModule, entity: Entity): Promise<PetEntity> {
	const playerPet = entity.Player.Pet;
	const swPet = guild.GuildPets[shelterPosition - 1];
	const swPetEntity = swPet.PetEntity;

	if (playerPet) {
		if (playerPet.isFeisty()) {
			await replyErrorMessage(interaction, language, petTransferModule.get("isFeisty"));
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

/**
 * Write the resulting description of transferring pets to the guild into the embed
 * @param playerPet
 * @param confirmEmbed
 * @param petTransferModule
 * @param language
 * @param swPetEntity
 */
function setDescriptionPetTransferEmbed(playerPet: PetEntity, confirmEmbed: DraftBotEmbed, petTransferModule: TranslationModule, language: string, swPetEntity: PetEntity): void {
	if (playerPet) {
		confirmEmbed.setDescription(petTransferModule.format("confirmSwitch", {
			pet1: `${playerPet.getPetEmote()} ${playerPet.nickname ? playerPet.nickname : playerPet.getPetTypeName(language)}`,
			pet2: `${swPetEntity.getPetEmote()} ${swPetEntity.nickname ? swPetEntity.nickname : swPetEntity.getPetTypeName(language)}`
		}));
	}
	else {
		confirmEmbed.setDescription(petTransferModule.format("confirmFollows", {
			pet: `${swPetEntity.getPetEmote()} ${swPetEntity.nickname ? swPetEntity.nickname : swPetEntity.getPetTypeName(language)}`
		}));
	}
	draftBotInstance.logsDatabase.logPetTransfer(playerPet, swPetEntity).then();
}

/**
 * Updates the missions of the given player concerning the actions made
 * @param entity
 * @param interaction
 * @param language
 * @param swPetEntity
 */
async function updateMissionsOfEntity(entity: Entity, interaction: CommandInteraction, language: string, swPetEntity: PetEntity): Promise<void> {
	await MissionsController.update(entity, interaction.channel, language, {missionId: "havePet"});
	await MissionsController.update(entity, interaction.channel, language, {
		missionId: "tamedPet",
		params: {loveLevel: swPetEntity.getLoveLevelNumber()}
	});
	await MissionsController.update(entity, interaction.channel, language, {
		missionId: "trainedPet",
		params: {loveLevel: swPetEntity.getLoveLevelNumber()}
	});
}

/**
 * Allow to transfer a pet
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}
	const petTransferModule = Translations.getModule("commands.petTransfer", language);
	const playerPet = entity.Player.Pet;

	const guild = await getGuildOfEntity(entity);
	if (!guild) {
		await replyErrorMessage(interaction, language, Translations.getModule("bot", language).get("notInAGuild"));
		return;
	}

	const guildPetCount = guild.GuildPets.length;
	const confirmEmbed = new DraftBotEmbed()
		.formatAuthor(petTransferModule.get("confirmSwitchTitle"), interaction.user);

	const shelterPositionOption = interaction.options.get("shelterposition");

	if (shelterPositionOption === null) {
		await transferPetToGuild(interaction, petTransferModule, entity, guild, confirmEmbed);
		return;
	}

	const shelterPosition = shelterPositionOption.value as number;

	if (guildPetCount === 0) {
		await replyErrorMessage(interaction, language, Translations.getModule("commands.guildShelter", language).get("noPetMessage"));
		return;
	}
	if (shelterPosition > guildPetCount) {
		await sendErrorInvalidPositionShelter(guildPetCount, interaction, language, petTransferModule);
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

const currentCommandFrenchTranslations = Translations.getModule("commands.petTransfer", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.petTransfer", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations)
		.addIntegerOption(option => option.setName(currentCommandEnglishTranslations.get("optionPositionName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionPositionName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionPositionDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionPositionDescription")
			})
			.setRequired(false)
			.setMinValue(1)
			.setMaxValue(PetEntityConstants.SLOTS)
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		allowEffects: [EffectsConstants.EMOJI_TEXT.SMILEY]
	},
	mainGuildCommand: false
};