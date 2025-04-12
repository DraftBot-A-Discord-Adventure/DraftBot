import { ICommand } from "../ICommand";
import {
	makePacket, PacketContext
} from "../../../../Lib/src/packets/DraftBotPacket";
import { SlashCommandBuilderGenerator } from "../SlashCommandBuilderGenerator";
import {
	CommandRespawnPacketReq,
	CommandRespawnPacketRes
} from "../../../../Lib/src/packets/commands/CommandRespawnPacket";
import { DiscordCache } from "../../bot/DiscordCache";
import i18n from "../../translations/i18n";
import { DraftBotIcons } from "../../../../Lib/src/DraftBotIcons";
import { EmoteUtils } from "../../utils/EmoteUtils";
import { DraftbotInteraction } from "../../messages/DraftbotInteraction";

/**
 * Get the respawn packet to send it to the server
 * @param interaction
 */
async function getPacket(interaction: DraftbotInteraction): Promise<CommandRespawnPacketReq> {
	await interaction.deferReply();
	return makePacket(CommandRespawnPacketReq, {});
}

/**
 * Handle the response to the respawn
 * @param packet
 * @param context
 */
export async function handleCommandRespawnPacketRes(packet: CommandRespawnPacketRes, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);

	await interaction?.editReply({
		content: i18n.t("commands:respawn.response", {
			lng: interaction.userLanguage,
			respawnEmote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.commands.respawn),
			scoreEmote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.unitValues.score),
			pseudo: interaction.user.displayName,
			count: packet.lostScore,
			interpolation: { escapeValue: false }
		})
	});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("respawn"),
	getPacket,
	mainGuildCommand: false
};
