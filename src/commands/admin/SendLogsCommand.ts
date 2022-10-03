import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {botConfig} from "../../core/bot";
import {replyErrorMessage} from "../../core/utils/ErrorUtils";
import * as fs from "fs";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

const currentCommandEnglishTranslations = Translations.getModule("commands.sendLogs", Constants.LANGUAGE.ENGLISH);
const currentCommandFrenchTranslations = Translations.getModule("commands.sendLogs", Constants.LANGUAGE.FRENCH);

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

	let inDM: boolean;
	try {
		inDM = interaction.options.get(currentCommandEnglishTranslations.get("optionDMName")).value as boolean;
	}
	catch {
		inDM = true;
	}

	if (interaction.options.get(currentCommandEnglishTranslations.get("optionFileName")) === null) {
		fs.readdir("logs", async function(err: (NodeJS.ErrnoException | null), files: string[]): Promise<void> {
			if (err) {
				await interaction.reply({content: `\`\`\`Unable to scan directory: ${err}\`\`\``});
				return;
			}

			let msg = "```";
			for (const file of files) {
				msg += `${file} (${fs.statSync(`logs/${file}`).size / 1000.0} ko)\n`;
				if (msg.length > 1800) {
					if (inDM) {
						await interaction.user.send({content: msg + "```"});
					}
					else {
						try {
							await interaction.reply({content: msg + "```", ephemeral: true});
						}
						catch {
							await interaction.followUp({content: msg + "```", ephemeral: true});
						}
					}
					msg = "```";
				}
			}
			if (msg !== "```") {
				if (inDM) {
					await interaction.user.send({content: msg + "```"});
				}
				else {
					try {
						await interaction.reply({content: msg + "```", ephemeral: true});
					}
					catch {
						await interaction.followUp({content: msg + "```", ephemeral: true});
					}
				}
			}
		});
		if (inDM) {
			await interaction.reply({content: "Logs list sent !"});
		}
	}
	else {
		let queriedFile = interaction.options.get(currentCommandEnglishTranslations.get("optionFileName")).value as string;
		if (queriedFile.includes("/") || queriedFile.includes("..")) {
			await replyErrorMessage(interaction, language, sendLogsModule.get("localFileInclusion"));
			return;
		}
		if (!queriedFile.endsWith(".txt")) {
			queriedFile += ".txt";
		}
		if (fs.existsSync(`logs/${queriedFile}`)) {
			if (inDM) {
				await interaction.user.send({
					files: [{
						attachment: `logs/${queriedFile}`,
						name: queriedFile
					}]
				});
				await interaction.reply({content: "Logs sent !"});
			}
			else {
				await interaction.reply({
					files: [{
						attachment: `logs/${queriedFile}`,
						name: queriedFile
					}],
					ephemeral: true
				});
			}
		}
		else {
			await replyErrorMessage(interaction, language, sendLogsModule.get("noLogFile"));
		}
	}
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations)
		.addStringOption(option => option.setName(currentCommandEnglishTranslations.get("optionFileName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionFileName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionFileDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionFileDescription")
			})
			.setRequired(false))
		.addBooleanOption(option => option.setName(currentCommandEnglishTranslations.get("optionDMName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionDMName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionDMDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionDMDescription")
			})
			.setRequired(false)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		userPermission: Constants.ROLES.USER.CONTRIBUTORS
	},
	mainGuildCommand: true
};
