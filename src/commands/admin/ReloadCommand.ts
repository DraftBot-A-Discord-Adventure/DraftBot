import {SlashCommandBuilder} from "@discordjs/builders";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {CommandsManager} from "../CommandsManager";
import {Translations} from "../../core/Translations";

/**
 * Allows the bot owner to reload commands
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const commands = await CommandsManager.getAllCommandsToRegister();
	const specificCommand = interaction.options.get("specific_command").value as string;
	let commandsReloaded = false;
	for (const command of commands) {
		if (!specificCommand || command.slashCommandBuilder.name === specificCommand) {
			CommandsManager.commands.set(command.slashCommandBuilder.name, command);
			commandsReloaded = true;
		}
	}
	await interaction.reply(Translations.getModule("commands.reload", language).format(
		commandsReloaded ? `success.${specificCommand ? "specific" : "all"}` : "notFound", {
			command: specificCommand
		}
	));
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("reload")
		.setDescription("Reload commands")
		.addStringOption(option => option.setName("specific_command")
			.setDescription("The command to reload")
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		userPermission: Constants.ROLES.USER.BOT_OWNER
	},
	mainGuildCommand: true
};