import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

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

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("vote")
		.setDescription("Display a link that allow a user to vote for the bot."),
	executeCommand,
	requirements: {},
	mainGuildCommand: false
};