import {ICommand} from "../ICommand";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {CommandHelpPacketReq} from "../../../../Lib/src/packets/commands/CommandHelpPacket";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {SlashCommandBuilder} from "@discordjs/builders";

/**
 * Get the list of available commands and information about what they do
 */
async function getPacket(interaction: DraftbotInteraction): Promise<CommandHelpPacketReq> {
	const packet = makePacket(CommandHelpPacketReq, {});
	await interaction.reply({
		embeds: [new DraftBotEmbed()
			.setTitle(i18n.t("commands:help.title", {
					lng: interaction.channel.language
				}
			))
			.setDescription(i18n.t("commands:help.description", {
				lng: interaction.channel.language
			}))]
	});
	return packet;
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("help")
		.addStringOption(option => SlashCommandBuilderGenerator.generateOption("help", "commandName", option)
			.setRequired(false)
		) as SlashCommandBuilder,
	getPacket,
	requirements: {},
	mainGuildCommand: false
};