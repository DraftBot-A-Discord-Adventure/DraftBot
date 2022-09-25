import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Constants} from "../../core/Constants";

/**
 * Shows the embed that redirects to the topGG vote page
 * @param interaction
 * @param language
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
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