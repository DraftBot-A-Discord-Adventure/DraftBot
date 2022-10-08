import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {TranslationModule, Translations} from "../../core/Translations";
import {ICommand} from "../ICommand";
import {HelpConstants} from "../../core/constants/HelpConstants";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {format} from "../../core/utils/StringFormatter";

/**
 * Get the list of commands mention from the command data
 * @param commandData
 */
function getListOfMentionFromCommandData(commandData: [string, unknown]): string {
	return format("{command:" + commandData[0].toLowerCase().split("")
		.filter((l: string) => l !== "_")
		.join("") + "}", {});
}

/**
 * Get all commands sorted by categories
 */
function getCommandByCategories(): { [key: string]: string[] } {
	const serverCommands: string[] = [], utilCommands: string[] = [], playerCommands: string[] = [],
		missionCommands: string[] = [], guildCommands: string[] = [], petCommands: string[] = [];
	for (const commandData of Object.entries(HelpConstants.COMMANDS_DATA)) {
		switch (commandData[1].CATEGORY) {
		case Constants.COMMAND_CATEGORY.SERVER:
			serverCommands.push(
				getListOfMentionFromCommandData(commandData));
			break;
		case Constants.COMMAND_CATEGORY.UTIL:
			utilCommands.push(
				getListOfMentionFromCommandData(commandData));
			break;
		case Constants.COMMAND_CATEGORY.PLAYER:
			playerCommands.push(
				getListOfMentionFromCommandData(commandData));
			break;
		case Constants.COMMAND_CATEGORY.MISSION:
			missionCommands.push(
				getListOfMentionFromCommandData(commandData));
			break;
		case Constants.COMMAND_CATEGORY.GUILD:
			guildCommands.push(
				getListOfMentionFromCommandData(commandData));
			break;
		case Constants.COMMAND_CATEGORY.PET:
			petCommands.push(
				getListOfMentionFromCommandData(commandData));
			break;
		default:
			break;
		}
	}
	return {serverCommands, utilCommands, playerCommands, missionCommands, guildCommands, petCommands};
}

/**
 * Updates the embed to make a generic help message
 * @param helpMessage
 * @param tr
 * @param interaction
 */
function generateGenericHelpMessage(helpMessage: DraftBotEmbed, tr: TranslationModule, interaction: CommandInteraction): void {
	const {
		serverCommands,
		utilCommands,
		playerCommands,
		missionCommands,
		guildCommands,
		petCommands
	} = getCommandByCategories();
	helpMessage.formatAuthor(tr.get("helpEmbedTitle"), interaction.user);
	helpMessage.setDescription(
		tr.format("helpEmbedDescription", {}) +
		"\n\u200b"
	);
	helpMessage.addFields([
		{
			name: tr.get("serverCommands"),
			value: `${serverCommands.sort().join(" • ")}`
		},
		{
			name: tr.get("utilCommands"),
			value: `${utilCommands.sort().join(" • ")}`
		},
		{
			name: tr.get("playerCommands"),
			value: `${playerCommands.join(" • ")}`
		},
		{
			name: tr.get("missionCommands"),
			value: `${missionCommands.join(" • ")}`
		},
		{
			name: tr.get("guildCommands"),
			value: `${guildCommands.sort().join(" • ")}`
		},
		{
			name: tr.get("petCommands"),
			value: `${petCommands.sort().join(" • ")} \n\u200b`
		},
		{
			name: tr.get("forMoreHelp"),
			value: tr.get("forMoreHelpValue")
		}
	]);
}

/**
 * Get all the accepted words when searching the help for the commands
 */
function getCommandAliasMap(): Map<string, string> {
	const helpAlias: Map<string, string> = new Map<string, string>();
	Object.entries(HelpConstants.ACCEPTED_SEARCH_WORDS).forEach(function(commands) {
		for (const alias of commands[1]) {
			helpAlias.set(alias, commands[0]);
		}
	});
	return helpAlias;
}

/**
 * Displays the link that allow to send the devs some suggestions
 * @param {CommandInteraction} interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const tr = Translations.getModule("commands.help", language);
	const helpMessage = new DraftBotEmbed();
	const command = interaction.options.get(Translations.getModule("commands.help", Constants.LANGUAGE.ENGLISH).get("optionCommandName"));
	const askedCommand = command ? command.value as string : null;
	if (!askedCommand) {
		generateGenericHelpMessage(helpMessage, tr, interaction);
		await interaction.reply({
			embeds: [helpMessage]
		});
	}
	else {
		const helpAlias = getCommandAliasMap();
		const command = helpAlias.get(askedCommand.toLowerCase().replace(" ", ""));
		let option1, option2;
		if (!command) {
			generateGenericHelpMessage(helpMessage, tr, interaction);
			await interaction.reply({
				embeds: [helpMessage]
			});
			return;
		}

		if (command === "PET_SELL") {
			option1 = Constants.PETS.SELL.MIN;
			option2 = Constants.PETS.SELL.MAX;
		}

		if (command === "FIGHT") {
			helpMessage.setImage(tr.get(`commands.${command}.image`));
		}

		helpMessage.setDescription(tr.format(`commands.${command}.description`, {
			option1,
			option2
		}))
			.setTitle(
				tr.format(
					"commandEmbedTitle",
					{
						emote: HelpConstants.COMMANDS_DATA[command as keyof typeof HelpConstants.COMMANDS_DATA].EMOTE
					}
				)
			);
		helpMessage.addFields({
			name: tr.get("usageFieldTitle"),
			value: tr.format(`commands.${command}.usage`, {}),
			inline: true
		});
		await interaction.reply({
			embeds: [helpMessage]
		});
	}
}

const currentCommandFrenchTranslations = Translations.getModule("commands.help", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.help", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations)
		.addStringOption(option => option.setName(currentCommandEnglishTranslations.get("optionCommandName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionCommandName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionCommandDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionCommandDescription")
			})
			.setRequired(false)
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {},
	mainGuildCommand: false
};
