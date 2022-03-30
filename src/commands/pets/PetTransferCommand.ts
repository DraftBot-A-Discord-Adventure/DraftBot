import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import Entity from "../../core/models/Entity";
import {GuildPets} from "../../core/models/GuildPet";
import {Guild, Guilds} from "../../core/models/Guild";
import {MissionsController} from "../../core/missions/MissionsController";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilder} from "@discordjs/builders";
import {sendBlockedErrorInteraction, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {CommandInteraction} from "discord.js";
import {TranslationModule, Translations} from "../../core/Translations";
import {Data} from "../../core/Data";

async function getGuildOfEntity(entity: Entity) {
	try {
		return await Guilds.getById(entity.Player.guildId);
	}
	catch (error) {
		return null;
	}
}

async function transfertPetToGuild(interaction: CommandInteraction, language: string, petTransferModule: TranslationModule, entity: Entity, guild: Guild, confirmEmbed: DraftBotEmbed) {
	const pPet = entity.Player.Pet;
	const guildPetCount = guild.GuildPets.length;
	if (!pPet) {
		return sendErrorMessage(interaction.user, interaction.channel, language, petTransferModule.get("noPetToTransfer"), false, interaction);
	}
	if (pPet.isFeisty()) {
		return sendErrorMessage(interaction.user, interaction.channel, language, petTransferModule.get("isFeisty"), false, interaction);
	}
	if (guildPetCount >= Data.getModule("models.pets").getNumber("slots")) {
		return sendErrorMessage(interaction.user, interaction.channel, language, petTransferModule.get("noSlotAvailable"), false, interaction);
	}
	entity.Player.petId = null;
	entity.Player.save();
	await (await GuildPets.addPet(guild.id, pPet.id)).save();
	confirmEmbed.setDescription(petTransferModule.format("confirmDeposit", {
		pet: pPet.getPetEmote() + " " + (pPet.nickname ? pPet.nickname : pPet.getPetTypeName(language))
	}));
	return interaction.reply({embeds: [confirmEmbed]});
}

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
	const pPet = entity.Player.Pet;

	const guild = await getGuildOfEntity(entity);
	if (!guild) {
		sendErrorMessage(interaction.user, interaction.channel, language, Translations.getModule("commands.guildKick", language).get("notInAguild"), false, interaction);
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
		sendErrorMessage(interaction.user, interaction.channel, language, petTransferModule.get("noPetMessage"), false, interaction);
		return;
	}
	if (shelterPosition > guildPetCount) {
		if (guildPetCount === 1) {
			sendErrorMessage(interaction.user, interaction.channel, language, petTransferModule.get("wrongPetNumberSingle"));
			return;
		}
		sendErrorMessage(interaction.user, interaction.channel, language, petTransferModule.format("wrongPetNumberBetween", {
			max: guildPetCount
		}));
		return;
	}

	const swPet = guild.GuildPets[shelterPosition - 1];
	const swPetEntity = swPet.PetEntity;

	if (pPet) {
		if (pPet.isFeisty()) {
			sendErrorMessage(interaction.user, interaction.channel, language, petTransferModule.get("isFeisty"));
			return;
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
		confirmEmbed.setDescription(petTransferModule.format("confirmSwitch", {
			pet1: pPet.getPetEmote() + " " + (pPet.nickname ? pPet.nickname : pPet.getPetTypeName(language)),
			pet2: swPetEntity.getPetEmote() + " " + (swPetEntity.nickname ? swPetEntity.nickname : swPetEntity.getPetTypeName(language))
		}));
	}
	else {
		confirmEmbed.setDescription(petTransferModule.format("confirmFollows", {
			pet: swPetEntity.getPetEmote() + " " + (swPetEntity.nickname ? swPetEntity.nickname : swPetEntity.getPetTypeName(language))
		}));
	}
	await interaction.reply({embeds: [confirmEmbed]});
	await MissionsController.update(entity.discordUserId, interaction.channel, language, "havePet");
	await MissionsController.update(entity.discordUserId, interaction.channel, language, "tamedPet", 1, {loveLevel: swPetEntity.getLoveLevelNumber()});
	await MissionsController.update(entity.discordUserId, interaction.channel, language, "trainedPet", 1, {loveLevel: swPetEntity.getLoveLevelNumber()});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("pettransfer")
		.setDescription("Leave your pet in the guild shelter and optionnally take one back")
		.addIntegerOption(option => option.setName("shelterposition")
			.setDescription("The position of the pet in the shelter you want to switch with")
			.setRequired(false)
			.setMinValue(1)
			.setMaxValue(Data.getModule("models.pets").getNumber("slots"))
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		allowEffects: [Constants.EFFECT.SMILEY],
		requiredLevel: null,
		disallowEffects: null,
		guildPermissions: null,
		guildRequired: null,
		userPermission: null
	},
	mainGuildCommand: false,
	slashCommandPermissions: null
};