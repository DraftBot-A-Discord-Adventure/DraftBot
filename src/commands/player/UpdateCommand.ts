import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";

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
	slashCommandBuilder: new SlashCommandBuilder()
		.setName(currentCommandEnglishTranslations.get("commandName"))
		.setNameLocalizations({
			fr: currentCommandFrenchTranslations.get("commandName")
		})
		.setDescription(currentCommandEnglishTranslations.get("commandDescription"))
		.setDescriptionLocalizations({
			fr: currentCommandFrenchTranslations.get("commandDescription")
		}),
	executeCommand,
	requirements: {},
	mainGuildCommand: false
};