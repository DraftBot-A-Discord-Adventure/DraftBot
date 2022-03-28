import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

async function executeCommand(interaction: CommandInteraction, language: string) {
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
	requirements: {
		allowEffects: null,
		requiredLevel: null,
		disallowEffects: null,
		guildPermissions: null,
		guildRequired: null,
		userPermission: null
	},
	mainGuildCommand: false,
	slashCommandPermissions: null
};