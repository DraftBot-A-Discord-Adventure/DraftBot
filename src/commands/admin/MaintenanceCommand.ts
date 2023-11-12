import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {Translations} from "../../core/Translations";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {draftBotInstance} from "../../core/bot";
import {DraftBotErrorEmbed} from "../../core/messages/DraftBotErrorEmbed";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {IPCClient} from "../../core/bot/ipc/IPCClient";
import {DraftbotInteraction} from "../../core/messages/DraftbotInteraction";

/**
 * Set the bot in maintenance mode
 * @param interaction
 * @param language
 */
async function executeCommand(interaction: DraftbotInteraction, language: string): Promise<void> {
	const tr = Translations.getModule("commands.maintenance", language);
	const enable = interaction.options.get("enable").value as boolean;
	const save = interaction.options.get("save").value as boolean;

	try {
		draftBotInstance.setMaintenance(enable, save);
		IPCClient.ipcSetMaintenance(enable);

		await interaction.reply({
			embeds: [
				new DraftBotEmbed()
					.formatAuthor(
						tr.get("embedTitle"),
						interaction.user
					)
					.setDescription(tr.get(enable ? "successMaintenanceOn" : "successMaintenanceOff"))
			]
		});
	} catch (err) {
		await interaction.reply({
			embeds: [
				new DraftBotErrorEmbed(
					interaction.user,
					interaction,
					language,
					tr.get("embedTitle")
				)
					.setDescription(tr.format("error", {
						error: err.stack
					}))
			]
		});
	}
}

const currentCommandFrenchTranslations = Translations.getModule("commands.maintenance", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.maintenance", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations)
		.addBooleanOption(option => option.setName(currentCommandEnglishTranslations.get("optionEnableName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionEnableName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionEnableDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionEnableDescription")
			})
			.setRequired(true))
		.addBooleanOption(option => option.setName(currentCommandEnglishTranslations.get("optionSaveName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionSaveName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionSaveDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionSaveDescription")
			})
			.setRequired(true)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		userPermission: Constants.ROLES.USER.CONTRIBUTORS
	},
	mainGuildCommand: true
};