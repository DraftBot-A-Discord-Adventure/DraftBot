import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CacheType, CommandInteraction} from "discord.js";
import {TranslationModule, Translations} from "../../core/Translations";
import {ICommand} from "../ICommand";
import {HelpConstants} from "../../core/constants/HelpConstants";
import {Constants} from "../../core/Constants";

function getCommandByCategories() {
	const commandsDataList = HelpConstants.COMMANDS_DATA;
	const serverCommands = [], utilCommands = [], playerCommands = [],
		missionCommands = [], guildCommands = [], petCommands = [];
	for (const commandData of Object.entries(commandsDataList)) {
		switch (commandData[1].CATEGORY) {
		case Constants.COMMAND_CATEGORY.SERVER:
			serverCommands.push(commandData[0].toLowerCase().replace("_", ""));
			break;
		case Constants.COMMAND_CATEGORY.UTIL:
			utilCommands.push(commandData[0].toLowerCase().replace("_", ""));
			break;
		case Constants.COMMAND_CATEGORY.PLAYER:
			playerCommands.push(commandData[0].toLowerCase().replace("_", ""));
			break;
		case Constants.COMMAND_CATEGORY.MISSION:
			missionCommands.push(commandData[0].toLowerCase().replace("_", ""));
			break;
		case Constants.COMMAND_CATEGORY.GUILD:
			guildCommands.push(commandData[0].toLowerCase().replace("_", ""));
			break;
		case Constants.COMMAND_CATEGORY.PET:
			petCommands.push(commandData[0].toLowerCase().replace("_", ""));
			break;
		default:
			break;
		}
	}
	return {serverCommands, utilCommands, playerCommands, missionCommands, guildCommands, petCommands};
}

function generateGenericHelpMessage(helpMessage: DraftBotEmbed, tr: TranslationModule, interaction: CommandInteraction<CacheType>) {
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
		tr.get("helpEmbedDescription") +
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

function getCommandAliasMap() {
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
async function executeCommand(interaction: CommandInteraction, language: string) {
	const tr = Translations.getModule("commands.help", language);
	const helpMessage = new DraftBotEmbed();
	const askedCommand = interaction.options.getString("command");
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

		helpMessage.setDescription(tr.format("commands." + command + ".description", {
			option1,
			option2
		}))
			.setTitle(
				tr.format(
					"commandEmbedTitle",
					{
						emote: HelpConstants.COMMANDS_DATA[command as keyof typeof HelpConstants.COMMANDS_DATA].EMOTE,
						cmd: command.toLowerCase().replace("_", "")
					}
				)
			);
		helpMessage.addField(
			tr.get("usageFieldTitle"),
			"`" + tr.get("commands." + command + ".usage") + "`",
			true
		);
		await interaction.reply({
			embeds: [helpMessage]
		});
	}
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("help")
		.setDescription("Get the list of available commands, and information about DraftBot")
		.addStringOption(option => option.setName("command")
			.setDescription("Get help about a specific command")
			.setRequired(false)
		) as SlashCommandBuilder,
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
