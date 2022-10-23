import {ICommand} from "../ICommand";
import {CommandInteraction, Message} from "discord.js";
import {Translations} from "../../core/Translations";
import {draftBotInstance, shardId} from "../../core/bot";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {LogsReadRequests} from "../../core/database/logs/LogsReadRequests";

/**
 * Pings the bot, to check if it is alive and how well is it
 * @param interaction
 * @param language
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const tr = Translations.getModule("commands.ping", language);
	const reply = await interaction.reply({content: tr.get("create"), fetchReply: true});
	const date = await LogsReadRequests.getAmountOfDailyPotionsBoughtByPlayer("1");
	await interaction.editReply({
		content: tr.format("edit",
			{
				latency: (reply as Message).createdTimestamp - interaction.createdTimestamp,
				apiLatency: draftBotInstance.client.ws.ping,
				shardId: shardId,
				totalShards: draftBotInstance.client.shard.count - 1
			})
	});
}

const currentCommandFrenchTranslations = Translations.getModule("commands.ping", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.ping", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations),
	executeCommand,
	requirements: {},
	mainGuildCommand: false
};
