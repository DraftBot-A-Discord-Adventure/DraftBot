import {ICommand} from "../ICommand";
import {Translations} from "../../core/Translations";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {DraftbotInteraction} from "../../core/messages/DraftbotInteraction";

/**
 * Shows the embed that redirects to the topGG vote page
 * @param interaction
 * @param language
 */
async function executeCommand(interaction: DraftbotInteraction, language: string): Promise<void> {
	const tr = Translations.getModule("commands.vote", language);
	await interaction.reply({
		embeds: [new DraftBotEmbed()
			.setDescription(tr.get("text"))
			.setTitle(tr.get("title"))]
	});
}

const currentCommandFrenchTranslations = Translations.getModule("commands.vote", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.vote", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations),
	executeCommand,
	requirements: {},
	mainGuildCommand: false
};