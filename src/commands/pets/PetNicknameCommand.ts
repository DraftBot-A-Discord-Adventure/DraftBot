import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {sendBlockedError} from "../../core/utils/BlockingUtils";
import {replyErrorMessage} from "../../core/utils/ErrorUtils";
import {Translations} from "../../core/Translations";
import {checkNameString} from "../../core/utils/StringUtils";
import {draftBotInstance} from "../../core/bot";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import Player from "../../core/database/game/models/Player";
import {PetEntities} from "../../core/database/game/models/PetEntity";
import {PetConstants} from "../../core/constants/PetConstants";
import {DraftbotInteraction} from "../../core/messages/DraftbotInteraction";

/**
 * Renames your current pet
 * @param interaction
 * @param language
 * @param player
 */
async function executeCommand(interaction: DraftbotInteraction, language: string, player: Player): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}
	const pet = await PetEntities.getById(player.petId);
	const petNickTranslations = Translations.getModule("commands.petNickname", language);
	if (!pet) {
		await replyErrorMessage(interaction, language, Translations.getModule("commands.pet", language).get("noPet"));
		return;
	}
	const petNicknameUntested = interaction.options.get(Translations.getModule("commands.petNickname", Constants.LANGUAGE.ENGLISH).get("optionNickName"));
	const petNickname = petNicknameUntested ? petNicknameUntested.value as string : null;
	const successEmbed = new DraftBotEmbed()
		.formatAuthor(petNickTranslations.get("successTitle"), interaction.user);
	if (petNickname === null) {
		successEmbed.setDescription(petNickTranslations.get("successNoName"));
	}
	else {
		if (!checkNameString(petNickname, PetConstants.NICKNAME_LENGTH_RANGE)) {
			await replyErrorMessage(interaction, language,
				`${petNickTranslations.get("invalidName")}\n${Translations.getModule("error", language).format("nameRules", {
					min: PetConstants.NICKNAME_LENGTH_RANGE.MIN,
					max: PetConstants.NICKNAME_LENGTH_RANGE.MAX
				})}`);
			return;
		}
		successEmbed.setDescription(petNickTranslations.format("success", {
			name: petNickname
		}));
	}

	pet.nickname = petNickname;
	await pet.save();
	draftBotInstance.logsDatabase.logPetNickname(pet).then();
	await interaction.reply({embeds: [successEmbed]});
}

const currentCommandFrenchTranslations = Translations.getModule("commands.petNickname", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.petNickname", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations)
		.addStringOption(option => option.setName(currentCommandEnglishTranslations.get("optionNickName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionNickName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionNickDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionNickDescription")
			})
			.setRequired(false)
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD]
	},
	mainGuildCommand: false
};
