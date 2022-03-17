import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {SlashCommandBuilder, SlashCommandStringOption} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {ICommand} from "../ICommand";

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

const setupCommandOption = function(option: SlashCommandStringOption): SlashCommandStringOption {
	option.setName("command")
		.setDescription("Get help about a specific command")
		.setRequired(false);
	const commandList: string[] = Array.from(this.commands.keys());
	for (let i = 0; i < commandList.length; i++) {
		const command = commandList[i];
		const cToTest = command.replace(new RegExp(/^.*\/(.*)Command\.js$/), "$1").toLowerCase();
		option.addChoice(cToTest, cToTest);
	}
	return option;
};

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("help")
		.setDescription("Get the list of available commands, and information about DraftBot")
		.addStringOption(option => setupCommandOption(option)) as SlashCommandBuilder,
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
