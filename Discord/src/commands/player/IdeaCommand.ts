import { CommandIdeaPacketReq } from "../../../../Lib/src/packets/commands/CommandIdeaPacket";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {ICommand} from "../ICommand";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

async function getPacket(interaction: DraftbotInteraction): Promise<CommandIdeaPacketReq> {
	const packet = makePacket(CommandIdeaPacketReq, {});

	await interaction.reply({
		embeds: [new DraftBotEmbed()
			.setTitle(i18n.t("commands:idea.title", {
				lng: interaction.channel.language
			}))
			.setDescription(i18n.t("commands:idea.description", {
				lng: interaction.channel.language
			}))]
	});

	return packet;
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("idea"),
	getPacket,
	requirements: {},
	mainGuildCommand: false
};