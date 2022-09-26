import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

/**
 * Displays the changelog of the bot
 * @param {CommandInteraction} interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const tr = Translations.getModule("commands.update", language);
	const updateMessage = new DraftBotEmbed()
		.setTitle(
			tr.get(
				"title"
			))
		.setDescription(tr.format(
			"text",
			{version: require("../../../../package.json").version}));
	await interaction.reply({
		embeds: [updateMessage]
	});
}

const currentCommandFrenchTranslations = Translations.getModule("commands.update", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.update", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations),
	executeCommand,
	requirements: {},
	mainGuildCommand: false
};