import {
	makePacket, PacketContext
} from "../../../../Lib/src/packets/DraftBotPacket";
import { ICommand } from "../ICommand";
import { SlashCommandBuilderGenerator } from "../SlashCommandBuilderGenerator";
import { DiscordCache } from "../../bot/DiscordCache";
import { DraftBotEmbed } from "../../messages/DraftBotEmbed";
import { DraftbotInteraction } from "../../messages/DraftbotInteraction";
import {
	CommandLeagueRewardPacketReq, CommandLeagueRewardSuccessPacketRes
} from "../../../../Lib/src/packets/commands/CommandLeagueRewardPacket";
import i18n from "../../translations/i18n";

/**
 * Get the packet
 */
async function getPacket(interaction: DraftbotInteraction): Promise<CommandLeagueRewardPacketReq> {
	await interaction.deferReply();
	return makePacket(CommandLeagueRewardPacketReq, {});
}

export async function handleCommandLeagueRewardSuccessPacket(packet: CommandLeagueRewardSuccessPacketRes, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);

	if (!interaction) {
		return;
	}
	const lng = context.discord!.language;

	await interaction.editReply({
		embeds: [
			new DraftBotEmbed()
				.formatAuthor(i18n.t("commands:leagueReward.title", {
					lng,
					pseudo: interaction.user.displayName
				}), interaction.user)
				.setDescription(i18n.t(`commands:leagueReward.description.${packet.rank === 1 ? "first" : "other"}`, {
					lng,
					score: packet.score,
					glory: packet.gloryPoints,
					rank: packet.rank,
					leagueId: packet.oldLeagueId,
					money: packet.money,
					xp: packet.xp
				}))
		]
	});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("leagueReward"),
	getPacket,
	mainGuildCommand: false
};
