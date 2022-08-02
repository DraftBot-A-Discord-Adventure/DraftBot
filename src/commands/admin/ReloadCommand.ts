import * as fs from "fs";
import {SlashCommandBuilder} from "@discordjs/builders";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {botConfig} from "../../core/bot";
import {CommandInteraction} from "discord.js";
import {CommandsManager} from "../CommandsManager";
import { Translations } from "../../core/Translations";

function getAllCommands(): ICommand[] {
	const commands: ICommand[] = [];

	const categories = fs.readdirSync("dist/src/commands");
	for (const category of categories) {
		if (category.endsWith(".js") || category.endsWith(".js.map")) {
			continue;
		}
		let commandsFiles = fs.readdirSync(`dist/src/commands/${category}`).filter(command => command.endsWith(".js"));
		if (!botConfig.TEST_MODE) {
			commandsFiles = commandsFiles.filter(command => !command.startsWith("Test"));
		}
		for (const commandFile of commandsFiles) {
			const commandInfo = require(`../${category + "/" + commandFile}`).commandInfo as ICommand;
			if (!commandInfo || !commandInfo.slashCommandBuilder) {
				console.error(`Command dist/src/commands/${category + "/" + commandFile} is not a slash command`);
				continue;
			}
			commands.push(commandInfo);
		}
	}

	return commands;
}

// eslint-disable-next-line require-await
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const commands = getAllCommands();
	const specificCommand = interaction.options.getString("specific_command");
	let commandsReloaded = 0;
	for (const command of commands) {
		if (!specificCommand || command.slashCommandBuilder.name === specificCommand) {
			CommandsManager.commands.set(command.slashCommandBuilder.name, command);
			commandsReloaded += 1;
		}
	}
	await interaction.reply(Translations.getModule("commands.reload", language).format(
		commandsReloaded === 0 ? "notFound" : "success." + (specificCommand ? "specific" : "all"), {
			command: specificCommand
		}
	));
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("reload")
		.setDescription("Reload commands")
		.addStringOption(option =>
			option
				.setName("specific_command")
				.setDescription("The command to reload")
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		userPermission: Constants.ROLES.USER.BOT_OWNER
	},
	mainGuildCommand: true
};