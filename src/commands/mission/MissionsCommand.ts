import {CommandInteraction} from "discord.js";
import {Entities, Entity} from "../../core/database/game/models/Entity";
import {MissionsController} from "../../core/missions/MissionsController";
import {DraftBotMissionsMessageBuilder} from "../../core/messages/DraftBotMissionsMessage";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {sendBlockedError} from "../../core/utils/BlockingUtils";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {Translations} from "../../core/Translations";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

/**
 * Shows the missions of the given entity (default : the one who entered the command)
 * @param interaction
 * @param language
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}
	let entityToLook = await Entities.getByOptions(interaction);
	if (entityToLook === null) {
		entityToLook = entity;
	}

	if (interaction.user.id === entityToLook.discordUserId) {
		await MissionsController.update(entity, interaction.channel, language, {missionId: "commandMission"});
	}
	entity = await Entities.getById(entity.id);

	await MissionsController.checkCompletedMissions(entity, interaction.channel, language);
	if (entityToLook.discordUserId === entity.discordUserId) {
		[entityToLook] = await Entities.getOrRegister(entityToLook.discordUserId);
	}
	await interaction.reply({
		embeds: [
			await new DraftBotMissionsMessageBuilder(
				entityToLook,
				interaction.user,
				language
			).build()
		]
	});
}

const currentCommandFrenchTranslations = Translations.getModule("commands.missions", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.missions", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations)
		.addUserOption(option => option.setName(currentCommandEnglishTranslations.get("optionUserName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionUserName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionUserDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionUserDescription")
			})
			.setRequired(false)
		)
		.addNumberOption(option => option.setName(currentCommandEnglishTranslations.get("optionRankName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionRankName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionRankDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionRankDescription")
			})
			.setRequired(false)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD]
	},
	mainGuildCommand: false
};
