import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {botConfig} from "../../core/bot";
import {replyErrorMessage} from "../../core/utils/ErrorUtils";
import * as fs from "fs";

/**
 * Allow a contributor to get the console logs
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const sendLogsModule = Translations.getModule("commands.sendLogs", language);
	if (interaction.channel.id !== botConfig.CONTRIBUTORS_CHANNEL) {
		await replyErrorMessage(
			interaction,
			language,
			Translations.getModule("error", language).get("notContributorsChannel"));
		return;
	}

	if (interaction.options.getString("specificfile") === null) {
		fs.readdir("logs", async function(err: (NodeJS.ErrnoException | null), files: string[]): Promise<void> {
			if (err) {
				return await interaction.reply({content: `\`\`\`Unable to scan directory: ${err}\`\`\``});
			}

			let msg = "```";
			for (const file of files) {
				msg += `${file} (${fs.statSync(`logs/${file}`).size / 1000.0} ko)\n`;
				if (msg.length > 1800) {
					await interaction.user.send({content: msg + "```"});
					msg = "```";
				}
			}
			if (msg !== "```") {
				await interaction.user.send({content: msg + "```"});
			}
		});
		await interaction.reply({content: "Logs list sent !"});
	}
	else {
		let queriedFile = interaction.options.getString("specificfile");
		if (queriedFile.includes("/") || queriedFile.includes("..")) {
			await replyErrorMessage(interaction, language, sendLogsModule.get("localFileInclusion"));
			return;
		}
		if (!queriedFile.endsWith(".txt")) {
			queriedFile += ".txt";
		}
		if (fs.existsSync(`logs/${queriedFile}`)) {
			await interaction.user.send({
				files: [{
					attachment: `logs/${queriedFile}`,
					name: queriedFile
				}]
			});
			await interaction.reply({content: "Logs sent !"});
		}
		else {
			await replyErrorMessage(interaction, language, sendLogsModule.get("noLogFile"));
		}
	}
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("sendlogs")
		.setDescription("Send a specific log file, or the list of all stored logs (contributors only)")
		.addStringOption(option => option.setName("specificfile")
			.setDescription("Name of the file to reach (optionnal) / unspecified : send the list of all logs")
			.setRequired(false)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		userPermission: Constants.ROLES.USER.CONTRIBUTORS
	},
	mainGuildCommand: true
};
