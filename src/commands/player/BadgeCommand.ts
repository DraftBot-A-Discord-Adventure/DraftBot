import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Translations} from "../../core/Translations";
import {ICommand} from "../ICommand";
import {HelpConstants} from "../../core/constants/HelpConstants";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {DraftbotInteraction} from "../../core/messages/DraftbotInteraction";

/**
 * Allow to use the object if the player has one in the dedicated slot of his inventory
 * @param {DraftbotInteraction} interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: DraftbotInteraction, language: string): Promise<void> {
	const tr = Translations.getModule("commands.help", language);
	const badgeMessage = new DraftBotEmbed()
		.setTitle(
			tr.format(
				"commandEmbedTitle",
				{emote: HelpConstants.COMMANDS_DATA.BADGES.EMOTE, cmd: "badge"}
			)
		)
		.setDescription(tr.get("commands.BADGES.description"));
	await interaction.reply({
		embeds: [badgeMessage]
	});
}

const currentCommandFrenchTranslations = Translations.getModule("commands.badges", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.badges", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations),
	executeCommand,
	requirements: {},
	mainGuildCommand: false
};