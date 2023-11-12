import {Translations} from "../../core/Translations";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {DraftbotInteraction} from "../../core/messages/DraftbotInteraction";

/**
 * Display the link to invite the bot to another server
 * @param {DraftbotInteraction} interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: DraftbotInteraction, language: string): Promise<void> {
	const tr = Translations.getModule("commands.invite", language);
	await interaction.reply({content: tr.get("main")});
}

const currentCommandFrenchTranslations = Translations.getModule("commands.invite", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.invite", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations),
	executeCommand,
	requirements: {},
	mainGuildCommand: false
};