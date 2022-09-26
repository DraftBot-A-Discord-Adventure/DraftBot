import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {ICommand} from "../ICommand";
import {HelpConstants} from "../../core/constants/HelpConstants";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

/**
 * +DEPRECATED+, Allow a server's owner to change the prefix of the bot on the current server
 * @param {CommandInteraction} interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const tr = Translations.getModule("commands.help", language);
	const prefixMessage = new DraftBotEmbed()
		.setTitle(
			tr.format(
				"commandEmbedTitle",
				{emote: HelpConstants.COMMANDS_DATA.PREFIX.EMOTE, cmd: "prefix"}
			)
		)
		.setDescription(tr.get("commands.PREFIX.description"));
	await interaction.reply({
		embeds: [prefixMessage]
	});
}

const currentCommandFrenchTranslations = Translations.getModule("commands.prefix", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.prefix", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations),
	executeCommand,
	requirements: {},
	mainGuildCommand: false
};