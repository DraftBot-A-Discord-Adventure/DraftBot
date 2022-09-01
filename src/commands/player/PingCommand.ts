import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, Message} from "discord.js";
import {Translations} from "../../core/Translations";
import {draftBotInstance, shardId} from "../../core/bot";

/**
 * Pings the bot, to check if it is alive and how well is it
 * @param interaction
 * @param language
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const tr = Translations.getModule("commands.ping", language);
	const reply = await interaction.reply({content: tr.get("create"), fetchReply: true});
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

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Displays the ping of the bot and allow the player to check if the bot is online"),
	executeCommand,
	requirements: {},
	mainGuildCommand: false
};
