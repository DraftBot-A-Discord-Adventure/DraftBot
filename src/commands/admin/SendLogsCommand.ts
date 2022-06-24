import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {botConfig} from "../../core/bot";
import {sendErrorMessage} from "../../core/utils/ErrorUtils";

/**
 * Allow a contributor to get the console logs
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const sendLogsModule = Translations.getModule("commands.sendLogs", language);
	if (interaction.channel.id !== botConfig.CONTRIBUTORS_CHANNEL) {
		sendErrorMessage(
			interaction.user,
			interaction,
			language,
			Translations.getModule("error", language).get("notContributorsChannel"));
		return;
	}

	const fs = require("fs");

	if (interaction.options.getString("specificfile") === null) {
		fs.readdir("logs", function(err: string, files: any[]) {
			if (err) {
				return interaction.reply({content: "```Unable to scan directory: " + err + "```"});
			}

			let msg = "```";
			files.forEach(function(file: string) {
				msg += file + " (" + fs.statSync("logs/" + file).size / 1000.0 + " ko)" + "\n";
				if (msg.length > 1800) {
					interaction.user.send({content: msg + "```"});
					msg = "```";
				}
			});
			if (msg !== "```") {
				interaction.user.send({content: msg + "```"});
			}
		});
		await interaction.reply({content: "Logs list sent !"});
	}
	else {
		let queriedFile = interaction.options.getString("specificfile");
		if (queriedFile.includes("/") || queriedFile.includes("..")) {
			sendErrorMessage(interaction.user, interaction, language, sendLogsModule.get("localFileInclusion"));
			return;
		}
		if (!queriedFile.endsWith(".txt")) {
			queriedFile += ".txt";
		}
		if (fs.existsSync("logs/" + queriedFile)) {
			await interaction.user.send({
				files: [{
					attachment: "logs/" + queriedFile,
					name: queriedFile
				}]
			});
			await interaction.reply({content: "Logs sent !"});
		}
		else {
			sendErrorMessage(interaction.user, interaction, language, sendLogsModule.get("noLogFile"));
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
