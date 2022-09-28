import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {Translations} from "../../core/Translations";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

/**
 * Allow an admin to change the prefix the bot use in a specific server
 * @param interaction
 */
async function executeCommand(interaction: CommandInteraction): Promise<void> {
	const blockingReason = await BlockingUtils.getPlayerBlockingReason(interaction.options.get("user").value as string);
	if (blockingReason.length === 0) {
		await interaction.reply({content: "Not blocked or the id given isn't a right user id", ephemeral: true});
		return;
	}
	await interaction.reply({content: `Blocking reason: ${blockingReason.toString()}`, ephemeral: true});
}

const currentCommandFrenchTranslations = Translations.getModule("commands.debugBlocked", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.debugBlocked", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations)
		.addStringOption(option => option.setName(currentCommandEnglishTranslations.get("optionUserName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionUserName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionUserDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionUserDescription")
			})
			.setRequired(true)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		userPermission: Constants.ROLES.USER.BOT_OWNER
	},
	mainGuildCommand: true
};