import {ICommand} from "../ICommand";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {CommandHelpPacketReq} from "../../../../Lib/src/packets/commands/CommandHelpPacket";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {SlashCommandBuilder} from "@discordjs/builders";
import {BotUtils} from "../../utils/BotUtils";
import {Language} from "../../../../Lib/src/Language";
import {PetConstants} from "../../../../Lib/src/constants/PetConstants";
import {HelpConstants} from "../../constants/HelpConstants";
import {Constants} from "../../Constants";

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
	const commandName = commandData[1].NAME;
	const commandMention = BotUtils.commandsMentions.get(commandName);
	return commandMention ? commandMention : i18n.t("error:commandDoesntExist", {lng: language});
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
	helpMessage.formatAuthor(i18n.t("commands:help.helpEmbedTitle", {
		lng: interaction.channel.language,
		pseudo: interaction.user.username
	}), interaction.user);
	helpMessage.setDescription(
		`${i18n.t("commands:help.helpEmbedDescription", {
			lng: interaction.channel.language,
			helpCommandMention: BotUtils.commandsMentions.get("help"),
			interpolation: {escapeValue: false}
		})}\n\u200b`
	);
	helpMessage.addFields([
		{
			name: i18n.t("commands:help.serverCommands", {lng: interaction.channel.language}),
			value: `${serverCommands.sort().join(HelpConstants.COMMAND_SEPARATOR_FOR_GENERAL_DESCRIPTION)}`
		},
		{
			name: i18n.t("commands:help.utilCommands", {lng: interaction.channel.language}),
			value: `${utilCommands.sort().join(HelpConstants.COMMAND_SEPARATOR_FOR_GENERAL_DESCRIPTION)}`
		},
		{
			name: i18n.t("commands:help.playerCommands", {lng: interaction.channel.language}),
			value: `${playerCommands.join(HelpConstants.COMMAND_SEPARATOR_FOR_GENERAL_DESCRIPTION)}`
		},
		{
			name: i18n.t("commands:help.missionCommands", {lng: interaction.channel.language}),
			value: `${missionCommands.join(HelpConstants.COMMAND_SEPARATOR_FOR_GENERAL_DESCRIPTION)}`
		},
		{
			name: i18n.t("commands:help.guildCommands", {lng: interaction.channel.language}),
			value: `${guildCommands.sort().join(HelpConstants.COMMAND_SEPARATOR_FOR_GENERAL_DESCRIPTION)}`
		},
		{
			name: i18n.t("commands:help.petCommands", {lng: interaction.channel.language}),
			value: `${petCommands.sort().join(HelpConstants.COMMAND_SEPARATOR_FOR_GENERAL_DESCRIPTION)} \n\u200b`
		},
		{
			name: i18n.t("commands:help.forMoreHelp", {lng: interaction.channel.language}),
			value: i18n.t("commands:help.forMoreHelpValue", {lng: interaction.channel.language})
		}
	]);
}

/**
 * Get all the accepted words when searching the help for the commands
 */
function getCommandAliasMap(): Map<string, string> {
	const helpAlias: Map<string, string> = new Map<string, string>();
	Object.entries(HelpConstants.ACCEPTED_SEARCH_WORDS).forEach((commands) => {
		for (const alias of commands[1]) {
			helpAlias.set(alias, commands[0]);
		}
	});
	return helpAlias;
}

/**
 * The help command has different replacements items for subcommands help messages. This method will generate the replacements object for the help command
 * @param interaction
 */
function generateReplacementObjectForHelpCommand(interaction: DraftbotInteraction): {
	lng: string;
	petSellMinPrice: number;
	petSellMaxPrice: number;
	classesCommandMention: string;
	topGloryCommandMention: string;
	mapCommandMention: string;
	petCommandMention: string;
	interpolation: { escapeValue: boolean };
} {
	const petSellMinPrice = PetConstants.SELL_PRICE.MIN;
	const petSellMaxPrice = PetConstants.SELL_PRICE.MAX;
	const classesCommandMention = BotUtils.commandsMentions.get("classes");
	const topGloryCommandMention = BotUtils.commandsMentions.get("top guilds");
	const mapCommandMention = BotUtils.commandsMentions.get("map");
	const petCommandMention = BotUtils.commandsMentions.get("pet");
	const classesCommandMentionString = classesCommandMention ? classesCommandMention : i18n.t("error:commandDoesntExist", {lng: interaction.channel.language});
	const topGloryCommandMentionString = topGloryCommandMention ? topGloryCommandMention : i18n.t("error:commandDoesntExist", {lng: interaction.channel.language});
	const mapCommandMentionString = mapCommandMention ? mapCommandMention : i18n.t("error:commandDoesntExist", {lng: interaction.channel.language});
	const petCommandMentionString = petCommandMention ? petCommandMention : i18n.t("error:commandDoesntExist", {lng: interaction.channel.language});
	return {
		lng: interaction.channel.language,
		petSellMinPrice,
		petSellMaxPrice,
		classesCommandMention: classesCommandMentionString,
		topGloryCommandMention: topGloryCommandMentionString,
		mapCommandMention: mapCommandMentionString,
		petCommandMention: petCommandMentionString,
		interpolation: {escapeValue: false}
	};
}

/**
 * Get the list of available commands and information about what they do
 */
async function getPacket(interaction: DraftbotInteraction): Promise<CommandHelpPacketReq> {
	const packet = makePacket(CommandHelpPacketReq, {});
	const helpMessage = new DraftBotEmbed();
	const command = interaction.options.get(i18n.t("discordBuilder:help.options.commandName.name", {lng: Constants.LANGUAGE.ENGLISH}));
	const askedCommand = command ? command.value as string : null;
	if (!askedCommand) {
		generateGenericHelpMessage(helpMessage, interaction);
		await interaction.reply({
			embeds: [helpMessage]
		});
	}
	else {
		const helpAlias = getCommandAliasMap();
		const command = helpAlias.get(askedCommand.toLowerCase().replace(" ", ""));
		if (!command) {
			generateGenericHelpMessage(helpMessage, interaction);
			await interaction.reply({
				embeds: [helpMessage]
			});
			return packet;
		}

		const commandMention = BotUtils.commandsMentions.get(HelpConstants.COMMANDS_DATA[command as keyof typeof HelpConstants.COMMANDS_DATA].NAME);
		const commandMentionString: string = commandMention ? commandMention : i18n.t("error:commandDoesntExist", {lng: interaction.channel.language});
		const replacements = generateReplacementObjectForHelpCommand(interaction);


		if (command === "FIGHT") {
			helpMessage.setImage(i18n.t("commands:help.commands.FIGHT.image", {lng: interaction.channel.language}));
		}

		helpMessage.setDescription(i18n.t(`commands:help.commands.${command}.description`, replacements))
			.setTitle(
				i18n.t("commands:help.commandEmbedTitle", {
					lng: interaction.channel.language,
					emote: HelpConstants.COMMANDS_DATA[command as keyof typeof HelpConstants.COMMANDS_DATA].EMOTE
				})
			);
		helpMessage.addFields({
			name: i18n.t("commands:help.usageFieldTitle", {lng: interaction.channel.language}),
			value: commandMentionString,
			inline: true
		});
		await interaction.reply({
			embeds: [helpMessage]
		});
	}
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