import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {SlashCommandBuilder, SlashCommandStringOption} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {ICommand} from "../ICommand";
import {Servers} from "../../core/models/Server";
import {Entities} from "../../core/models/Entity";
import {isOnMainServer} from "../../core/utils/ShardUtils";
import {CommandsManager} from "../CommandsManager";

/**
 * Displays the link that allow to send the devs some suggestions
 * @param {CommandInteraction} interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string) {
	const tr = Translations.getModule("commands.help", language);
	const server = await Servers.getOrRegister(interaction.guild.id);
	let helpMessage;
	const askedCommand = interaction.options.getString("command");
	interaction.reply("bonjour");
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("help")
		.setDescription("Get the list of available commands, and information about DraftBot")
		.addStringOption(option => option.setName("command")
			.setDescription("Get help about a specific command")
			.setRequired(false)
		) as SlashCommandBuilder,
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
