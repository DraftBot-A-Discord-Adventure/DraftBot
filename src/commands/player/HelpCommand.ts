import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {ICommand} from "../ICommand";
import {CommandsManager} from "../CommandsManager";
import {Constants} from "../../core/Constants";

/**
 * Displays the link that allow to send the devs some suggestions
 * @param {CommandInteraction} interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string) {
	const tr = Translations.getModule("commands.idea", language);
	const ideaMessage = new DraftBotEmbed()
		.setTitle(
			tr.get(
				"title"
			))
		.setDescription(tr.get(
			"text"));
	await interaction.reply({
		embeds: [ideaMessage]
	});

}

const getCommandNameArray = async function(): Promise<[string, string][]> {
	const list: [string, string][] = [];
	for (const command of await CommandsManager.getCommandList()){
		list.push([command.slashCommandBuilder.name,command.slashCommandBuilder.name]);
	}
	return list;
};

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("help")
		.setDescription("Get the list of available commands, and information about DraftBot")
		.addStringOption(option => option.setName("command")
			.setDescription("Get help about a specific command")
			.addChoices(getCommandNameArray())
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
