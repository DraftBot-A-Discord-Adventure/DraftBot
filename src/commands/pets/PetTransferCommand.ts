import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {GuildPets} from "../../core/database/game/models/GuildPet";
import {Guild, Guilds} from "../../core/database/game/models/Guild";
import {MissionsController} from "../../core/missions/MissionsController";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {replyErrorMessage} from "../../core/utils/ErrorUtils";
import {CommandInteraction} from "discord.js";
import {TranslationModule, Translations} from "../../core/Translations";
import PetEntity, {PetEntities} from "../../core/database/game/models/PetEntity";
import {sendBlockedError} from "../../core/utils/BlockingUtils";
import {draftBotInstance} from "../../core/bot";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {PetEntityConstants} from "../../core/constants/PetEntityConstants";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import Player from "../../core/database/game/models/Player";
import {Pet, Pets} from "../../core/database/game/models/Pet";

/**
 * Get the guild from a given player
 * @param player
 */
async function getGuildOfPlayer(player: Player): Promise<Guild> {
	try {
		return await Guilds.getById(player.guildId);
	}
	catch (error) {
		return null;
	}
}

/**
 * Transfer your pet to the guild's shelter
 * @param interaction
 * @param petTransferModule
 * @param player
 * @param guild
 * @param confirmEmbed
 * @param playerPet
 */
// eslint-disable-next-line max-params
async function transferPetToGuild(
	interaction: CommandInteraction,
	petTransferModule: TranslationModule,
	player: Player,
	guild: Guild,
	confirmEmbed: DraftBotEmbed,
	playerPet: PetEntity
): Promise<void> {
	const guildPetCount = (await GuildPets.getOfGuild(guild.id)).length;
	if (!playerPet) {
		return replyErrorMessage(interaction, petTransferModule.language, petTransferModule.format("noPetToTransfer", {}));
	}
	const playerPetModel = await Pets.getById(playerPet.petId);
	if (playerPet.isFeisty()) {
		return replyErrorMessage(interaction, petTransferModule.language, petTransferModule.get("isFeisty"));
	}
	if (guildPetCount >= PetEntityConstants.SLOTS) {
		return replyErrorMessage(interaction, petTransferModule.language, petTransferModule.get("noSlotAvailable"));
	}
	player.petId = null;
	await player.save();
	await GuildPets.addPet(guild, playerPet, false).save();
	confirmEmbed.setDescription(petTransferModule.format("confirmDeposit", {
		pet: `${playerPet.getPetEmote(playerPetModel)} ${playerPet.nickname ? playerPet.nickname : playerPet.getPetTypeName(playerPetModel, petTransferModule.language)}`
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
 * @param player
 */
async function switchPets(guild: Guild, shelterPosition: number, interaction: CommandInteraction, language: string, petTransferModule: TranslationModule, player: Player): Promise<PetEntity> {
	const playerPet = await PetEntities.getById(player.petId);
	const swPet = (await GuildPets.getOfGuild(guild.id))[shelterPosition - 1];
	const swPetEntity = await PetEntities.getById(swPet.petEntityId);

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
	player.petId = swPetEntity.id;
	await player.save();
	return swPetEntity;
}

/**
 * Write the resulting description of transferring pets to the guild into the embed
 * @param playerPet
 * @param confirmEmbed
 * @param petTransferModule
 * @param language
 * @param swPetEntity
 * @param swPetModel
 */
// eslint-disable-next-line max-params
async function setDescriptionPetTransferEmbed(
	playerPet: PetEntity,
	confirmEmbed: DraftBotEmbed,
	petTransferModule: TranslationModule,
	language: string,
	swPetEntity: PetEntity, swPetModel: Pet
): Promise<void> {
	if (playerPet) {
		const playerPetModel = await Pets.getById(playerPet.petId);
		confirmEmbed.setDescription(petTransferModule.format("confirmSwitch", {
			pet1: `${playerPet.getPetEmote(playerPetModel)} ${playerPet.nickname ? playerPet.nickname : playerPet.getPetTypeName(playerPetModel, language)}`,
			pet2: `${swPetEntity.getPetEmote(swPetModel)} ${swPetEntity.nickname ? swPetEntity.nickname : swPetEntity.getPetTypeName(swPetModel, language)}`
		}));
	}
	else {
		confirmEmbed.setDescription(petTransferModule.format("confirmFollows", {
			pet: `${swPetEntity.getPetEmote(swPetModel)} ${swPetEntity.nickname ? swPetEntity.nickname : swPetEntity.getPetTypeName(swPetModel, language)}`
		}));
	}
	draftBotInstance.logsDatabase.logPetTransfer(playerPet, swPetEntity).then();
}

/**
 * Updates the missions of the given player concerning the actions made
 * @param player
 * @param interaction
 * @param language
 * @param swPetEntity
 */
async function updateMissionsOfEntity(player: Player, interaction: CommandInteraction, language: string, swPetEntity: PetEntity): Promise<void> {
	await MissionsController.update(player, interaction.channel, language, {missionId: "havePet"});
	await MissionsController.update(player, interaction.channel, language, {
		missionId: "tamedPet",
		params: {loveLevel: swPetEntity.getLoveLevelNumber()}
	});
	await MissionsController.update(player, interaction.channel, language, {
		missionId: "trainedPet",
		params: {loveLevel: swPetEntity.getLoveLevelNumber()}
	});
}

/**
 * Allow to transfer a pet
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param player
 */
async function executeCommand(interaction: CommandInteraction, language: string, player: Player): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}
	const petTransferModule = Translations.getModule("commands.petTransfer", language);
	const playerPet = await PetEntities.getById(player.petId);

	const guild = await getGuildOfPlayer(player);
	if (!guild) {
		await replyErrorMessage(interaction, language, Translations.getModule("bot", language).get("notInAGuild"));
		return;
	}

	const confirmEmbed = new DraftBotEmbed()
		.formatAuthor(petTransferModule.get("confirmSwitchTitle"), interaction.user);

	const shelterPositionOption = interaction.options.get(Translations.getModule("commands.petTransfer", Constants.LANGUAGE.ENGLISH).get("optionPositionName"));

	if (shelterPositionOption === null) {
		await transferPetToGuild(interaction, petTransferModule, player, guild, confirmEmbed, playerPet);
		return;
	}

	const guildPetCount = (await GuildPets.getOfGuild(guild.id)).length;
	const shelterPosition = shelterPositionOption.value as number;

	if (guildPetCount === 0) {
		await replyErrorMessage(interaction, language, Translations.getModule("commands.guildShelter", language).get("noPetMessage"));
		return;
	}
	if (shelterPosition > guildPetCount) {
		await sendErrorInvalidPositionShelter(guildPetCount, interaction, language, petTransferModule);
		return;
	}

	const swPetEntity = await switchPets(guild, shelterPosition, interaction, language, petTransferModule, player);
	if (swPetEntity === null) {
		return null;
	}
	const swPetModel = await Pets.getById(swPetEntity.petId);

	await setDescriptionPetTransferEmbed(playerPet, confirmEmbed, petTransferModule, language, swPetEntity, swPetModel);
	await interaction.reply({embeds: [confirmEmbed]});
	await updateMissionsOfEntity(player, interaction, language, swPetEntity);
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