import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {ICommand} from "../ICommand";

/**
 * Allow to use the object if the player has one in the dedicated slot of his inventory
 * @param {CommandInteraction} interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string) {
	const helpModule = Translations.getModule("commands.help", language);
	const helpMessage = new DraftBotEmbed()
		.setDescription(helpModule.get("commands.badge.description"))
		.setTitle(
			helpModule.format(
				"commandEmbedTitle",
				{emote: helpModule.get("commands.badge.emote"), cmd: "badges"}
			)
		);
	helpMessage.addField(
		helpModule.get("usageFieldTitle"),
		"`" + helpModule.get("commands.badge.usage") + "`",
		true
	);
	await interaction.reply({
		embeds: [helpMessage]
	});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("badges")
		.setDescription("Donne des informations sur les badges"),
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