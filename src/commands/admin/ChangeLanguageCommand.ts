import {Servers} from "../../core/database/game/models/Server";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";

/**
 * Allow an admin to change the prefix the bot use in a specific server
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const [server] = await Servers.getOrRegister(interaction.guild.id);
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

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("language")
		.setDescription("Change the server's main language") as SlashCommandBuilder,
	executeCommand,
	requirements: {
		userPermission: Constants.ROLES.USER.ADMINISTRATOR
	},
	mainGuildCommand: false
};