import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {ICommand} from "../ICommand";
import {HelpConstants} from "../../core/constants/HelpConstants";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

/**
 * Allow to use the object if the player has one in the dedicated slot of his inventory
 * @param {CommandInteraction} interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const tr = Translations.getModule("commands.help", language);
	const badgeMessage = new DraftBotEmbed()
		.setTitle(
			tr.format(
				"commandEmbedTitle",
				{emote: HelpConstants.COMMANDS_DATA.BADGE.EMOTE, cmd: "badge"}
			)
		)
		.setDescription(tr.get("commands.BADGE.description"));
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