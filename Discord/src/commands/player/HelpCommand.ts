import { ICommand } from "../ICommand";
import { DraftbotInteraction } from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import { SlashCommandBuilderGenerator } from "../SlashCommandBuilderGenerator";
import { DraftBotEmbed } from "../../messages/DraftBotEmbed";
import { SlashCommandBuilder } from "@discordjs/builders";
import { BotUtils } from "../../utils/BotUtils";
import {
	LANGUAGE, Language
} from "../../../../Lib/src/Language";
import { PetConstants } from "../../../../Lib/src/constants/PetConstants";
import { HelpConstants } from "../../../../Lib/src/constants/HelpConstants";
import {
	discordConfig, draftBotClient
} from "../../bot/DraftBotShard";
import { minutesToMilliseconds } from "../../../../Lib/src/utils/TimeUtils";
import { DraftBotLogger } from "../../../../Lib/src/logs/DraftBotLogger";
import { escapeUsername } from "../../utils/StringUtils";

const dmHelpCooldowns: Map<string, Date> = new Map<string, Date>();

/**
 * Get the list of commands mention from the command data
 * @param commandData
 */
function getListOfMentionFromCommandData(commandData: [string, {
	EMOTE: string;
	NAME: string;
	CATEGORY: string;
}]): string {
	const commandName = commandData[1].NAME;
	const commandMention = BotUtils.commandsMentions.get(commandName);
	return commandMention ? commandMention : `/${commandName}`;
}

/**
 * Get all commands sorted by categories
 */
function getCommandByCategories(): { [key: string]: string[] } {
	const utilCommands: string[] = [], playerCommands: string[] = [],
		missionCommands: string[] = [], guildCommands: string[] = [], petCommands: string[] = [];
	for (const commandData of Object.entries(HelpConstants.COMMANDS_DATA)) {
		switch (commandData[1].CATEGORY) {
			case HelpConstants.COMMAND_CATEGORY.UTIL:
				utilCommands.push(
					getListOfMentionFromCommandData(commandData)
				);
				break;
			case HelpConstants.COMMAND_CATEGORY.PLAYER:
				playerCommands.push(
					getListOfMentionFromCommandData(commandData)
				);
				break;
			case HelpConstants.COMMAND_CATEGORY.MISSION:
				missionCommands.push(
					getListOfMentionFromCommandData(commandData)
				);
				break;
			case HelpConstants.COMMAND_CATEGORY.GUILD:
				guildCommands.push(
					getListOfMentionFromCommandData(commandData)
				);
				break;
			case HelpConstants.COMMAND_CATEGORY.PET:
				petCommands.push(
					getListOfMentionFromCommandData(commandData)
				);
				break;
			default:
				break;
		}
	}
	return {
		utilCommands,
		playerCommands,
		missionCommands,
		guildCommands,
		petCommands
	};
}

/**
 * Updates the embed to make a generic help message
 * @param helpMessage
 * @param interaction
 */
function generateGenericHelpMessage(helpMessage: DraftBotEmbed, interaction: DraftbotInteraction): void {
	const lng = interaction.userLanguage;
	const {
		utilCommands,
		playerCommands,
		missionCommands,
		guildCommands,
		petCommands
	} = getCommandByCategories();
	helpMessage.formatAuthor(i18n.t("commands:help.helpEmbedTitle", {
		lng,
		pseudo: escapeUsername(interaction.user.displayName)
	}), interaction.user);
	helpMessage.setDescription(
		`${i18n.t("commands:help.helpEmbedDescription", {
			lng
		})}\n\u200b`
	);
	helpMessage.addFields([
		{
			name: i18n.t("commands:help.utilCommands", { lng }),
			value: `${utilCommands.sort()
				.join(HelpConstants.COMMAND_SEPARATOR_FOR_GENERAL_DESCRIPTION)}`
		},
		{
			name: i18n.t("commands:help.playerCommands", { lng }),
			value: `${playerCommands.join(HelpConstants.COMMAND_SEPARATOR_FOR_GENERAL_DESCRIPTION)}`
		},
		{
			name: i18n.t("commands:help.missionCommands", { lng }),
			value: `${missionCommands.join(HelpConstants.COMMAND_SEPARATOR_FOR_GENERAL_DESCRIPTION)}`
		},
		{
			name: i18n.t("commands:help.guildCommands", { lng }),
			value: `${guildCommands.sort()
				.join(HelpConstants.COMMAND_SEPARATOR_FOR_GENERAL_DESCRIPTION)}`
		},
		{
			name: i18n.t("commands:help.petCommands", { lng }),
			value: `${petCommands.sort()
				.join(HelpConstants.COMMAND_SEPARATOR_FOR_GENERAL_DESCRIPTION)} \n\u200b`
		},
		{
			name: i18n.t("commands:help.forMoreHelp", { lng }),
			value: i18n.t("commands:help.forMoreHelpValue", { lng })
		}
	]);
}

/**
 * Get all the accepted words when searching the help for the commands
 */
function getCommandAliasMap(): Map<string, string> {
	const helpAlias: Map<string, string> = new Map<string, string>();
	Object.entries(HelpConstants.ACCEPTED_SEARCH_WORDS)
		.forEach(commands => {
			for (const alias of commands[1]) {
				helpAlias.set(alias, commands[0]);
			}
		});
	return helpAlias;
}

/**
 * Send a DM to the user with the help message if the user is not in the main server
 * It will also set a cooldown for the user to prevent spamming
 * @param interaction
 * @param lng
 */
function sendHelpDm(interaction: DraftbotInteraction, lng: Language): void {
	draftBotClient.shard!.broadcastEval(async (client, context) => {
		const guild = await client.guilds.fetch(context.mainServerId);
		if (guild.shard) {
			try {
				return Boolean(await guild.members.fetch(context.userId));
			}
			catch {
				return false;
			}
		}
		return false;
	}, {
		context: {
			mainServerId: discordConfig.MAIN_SERVER_ID,
			userId: interaction.user.id
		}
	})
		.then((ret: boolean[]) => {
			if (!ret.some(value => value)) {
				interaction.user.send({
					content: HelpConstants.HELP_INVITE_LINK,
					embeds: [
						new DraftBotEmbed()
							.formatAuthor(i18n.t("commands:help.needHelp", {
								lng
							}), interaction.user)
							.setDescription(i18n.t("commands:help.needHelpDescription", {
								lng,
								inviteLink: HelpConstants.HELP_INVITE_LINK
							}))
					]
				})
					.catch(e => {
						DraftBotLogger.errorWithObj(`Error while sending help DM to user ${interaction.user.id}`, e);
					});
			}

			dmHelpCooldowns.set(interaction.user.id, new Date(Date.now() + minutesToMilliseconds(HelpConstants.HELP_DM_COOLDOWN_TIME_MINUTES)));
		})
		.catch(error => {
			DraftBotLogger.errorWithObj("Error while broadcasting the message in help command", error);
		});
}

/**
 * Get the list of available commands and information about what they do
 */
async function getPacket(interaction: DraftbotInteraction): Promise<null> {
	const helpMessage = new DraftBotEmbed();
	const command = interaction.options.get(i18n.t("discordBuilder:help.options.commandName.name", { lng: LANGUAGE.ENGLISH }));
	const askedCommand = command ? command.value as string : null;
	const lng = interaction.userLanguage;

	if (!askedCommand) {
		generateGenericHelpMessage(helpMessage, interaction);
		await interaction.reply({
			embeds: [helpMessage]
		});
	}
	else {
		const helpAlias = getCommandAliasMap();
		const command = helpAlias.get(askedCommand.toLowerCase()
			.replace(" ", ""));
		if (!command) {
			generateGenericHelpMessage(helpMessage, interaction);
			await interaction.reply({
				embeds: [helpMessage]
			});
			return null;
		}

		const commandMention = BotUtils.commandsMentions.get(HelpConstants.COMMANDS_DATA[command as keyof typeof HelpConstants.COMMANDS_DATA].NAME);
		const commandMentionString: string = commandMention ? commandMention : i18n.t("error:commandDoesntExist", { lng });


		if (command === "FIGHT") {
			helpMessage.setImage(i18n.t("commands:help.commands.FIGHT.image", { lng }));
		}

		helpMessage.setTitle(
			i18n.t("commands:help.commandEmbedTitle", {
				lng,
				emote: HelpConstants.COMMANDS_DATA[command as keyof typeof HelpConstants.COMMANDS_DATA].EMOTE
			})
		)
			.setDescription(i18n.t(`commands:help.commands.${command}.description`, {
				lng: interaction.userLanguage,
				petSellMinPrice: PetConstants.SELL_PRICE.MIN,
				petSellMaxPrice: PetConstants.SELL_PRICE.MAX
			}))
			.addFields({
				name: i18n.t("commands:help.usageFieldTitle", { lng }),
				value: commandMentionString,
				inline: true
			});
		await interaction.reply({
			embeds: [helpMessage]
		});
	}

	// Send help DM if the user is not in the main server
	const dmCooldown = dmHelpCooldowns.get(interaction.user.id);
	if (!dmCooldown || dmCooldown && dmCooldown.valueOf() < Date.now()) {
		sendHelpDm(interaction, lng);
	}

	return null;
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("help")
		.addStringOption(option => SlashCommandBuilderGenerator.generateOption("help", "commandName", option)
			.setRequired(false)) as SlashCommandBuilder,
	getPacket,
	mainGuildCommand: false
};
