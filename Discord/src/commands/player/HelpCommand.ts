import {ICommand} from "../ICommand";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {CommandHelpPacketReq} from "../../../../Lib/src/packets/commands/CommandHelpPacket";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {SlashCommandBuilder} from "@discordjs/builders";
import {HelpConstants} from "../../../../Lib/src/constants/HelpConstants";
import {BotUtils} from "../../utils/BotUtils";
import {Language} from "../../../../Lib/src/Language";

/**
 * Get the list of commands mention from the command data
 * @param commandData
 * @param language used for the error message in case the command doesn't exist
 */
function getListOfMentionFromCommandData(commandData: [string, {
	EMOTE: string,
	NAME: string,
	CATEGORY: string
}], language: Language): string {
	return BotUtils.commandsMentions.get(commandData[1].NAME) ? BotUtils.commandsMentions.get(commandData[1].NAME)! : i18n.t("error:commandDoesntExist", {lng: language});
}

/**
 * Get all commands sorted by categories
 * @param language used for the error message in case the command doesn't exist
 */
function getCommandByCategories(language: Language): { [key: string]: string[] } {
	const serverCommands: string[] = [], utilCommands: string[] = [], playerCommands: string[] = [],
		missionCommands: string[] = [], guildCommands: string[] = [], petCommands: string[] = [];
	for (const commandData of Object.entries(HelpConstants.COMMANDS_DATA)) {
		switch (commandData[1].CATEGORY) {
		case HelpConstants.COMMAND_CATEGORY.SERVER:
			serverCommands.push(
				getListOfMentionFromCommandData(commandData, language)
			);
			break;
		case HelpConstants.COMMAND_CATEGORY.UTIL:
			utilCommands.push(
				getListOfMentionFromCommandData(commandData, language)
			);
			break;
		case HelpConstants.COMMAND_CATEGORY.PLAYER:
			playerCommands.push(
				getListOfMentionFromCommandData(commandData, language)
			);
			break;
		case HelpConstants.COMMAND_CATEGORY.MISSION:
			missionCommands.push(
				getListOfMentionFromCommandData(commandData, language)
			);
			break;
		case HelpConstants.COMMAND_CATEGORY.GUILD:
			guildCommands.push(
				getListOfMentionFromCommandData(commandData, language)
			);
			break;
		case HelpConstants.COMMAND_CATEGORY.PET:
			petCommands.push(
				getListOfMentionFromCommandData(commandData, language)
			);
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
 * @param interaction
 */
function generateGenericHelpMessage(helpMessage: DraftBotEmbed, interaction: DraftbotInteraction): void {
	const {
		serverCommands,
		utilCommands,
		playerCommands,
		missionCommands,
		guildCommands,
		petCommands
	} = getCommandByCategories(interaction.channel.language);
	helpMessage.formatAuthor(tr.get("helpEmbedTitle"), interaction.user);
	helpMessage.setDescription(
		`${tr.format("helpEmbedDescription")}\n\u200b`
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
 * Get the list of available commands and information about what they do
 */
async function getPacket(interaction: DraftbotInteraction): Promise<CommandHelpPacketReq> {
	const packet = makePacket(CommandHelpPacketReq, {});
	const helpMessage = new DraftBotEmbed();
	const command = interaction.options.get(i18n.t("discordBuilder:help.options.commandName.name", {lng: interaction.channel.language}));
	const askedCommand = command ? command.value as string : null;
	if (!askedCommand) {
		generateGenericHelpMessage(helpMessage, interaction);
		await interaction.reply({
			embeds: [helpMessage]
		});
	}
	await interaction.reply({
		embeds: [new DraftBotEmbed()
			.setTitle(i18n.t("commands:help.title", {
				lng: interaction.channel.language
			}))
			.setDescription(i18n.t("commands:help.description", {
				lng: interaction.channel.language
			}))]
	});
	return packet;
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("help")
		.addStringOption(option => SlashCommandBuilderGenerator.generateOption("help", "commandName", option)
			.setRequired(false)) as SlashCommandBuilder,
	getPacket,
	requirements: {},
	mainGuildCommand: false
};