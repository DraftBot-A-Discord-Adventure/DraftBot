import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {ICommand} from "../ICommand";

/**
 * Display the link to invite the bot to another server
 * @param {CommandInteraction} interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string) {
	const tr = Translations.getModule("commands.invite", language);
	await interaction.reply({content: tr.get("main")});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("invite")
		.setDescription("Display the link to invite the bot to another server"),
	executeCommand,
	requirements: {},
	mainGuildCommand: false
};