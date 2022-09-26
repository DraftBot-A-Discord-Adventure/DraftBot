import {Servers} from "../../core/database/game/models/Server";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

/**
 * Allow an admin to change the prefix the bot use in a specific server
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const server = await Servers.getOrRegister(interaction.guild.id);
	const languageModule = Translations.getModule("commands.changeLanguage", language);
	if (server.language === Constants.LANGUAGE.FRENCH) {
		server.language = Constants.LANGUAGE.ENGLISH;
	}
	else {
		server.language = Constants.LANGUAGE.FRENCH;
	}
	await server.save();
	await interaction.reply({
		embeds: [new DraftBotEmbed()
			.formatAuthor(languageModule.get("title"), interaction.user)
			.setDescription(languageModule.get("desc"))]
	});
}

const currentCommandFrenchTranslations = Translations.getModule("commands.changeLanguage", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.changeLanguage", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations,currentCommandEnglishTranslations),
	executeCommand,
	requirements: {
		userPermission: Constants.ROLES.USER.ADMINISTRATOR
	},
	mainGuildCommand: false
};