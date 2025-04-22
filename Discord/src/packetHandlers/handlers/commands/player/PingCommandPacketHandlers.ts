import { packetHandler } from "../../../PacketHandler";
import { CommandPingPacketRes } from "../../../../../../Lib/src/packets/commands/CommandPingPacket";
import { PacketContext } from "../../../../../../Lib/src/packets/DraftBotPacket";
import { DiscordCache } from "../../../../bot/DiscordCache";
import i18n from "../../../../translations/i18n";
import {
	draftBotClient, shardId
} from "../../../../bot/DraftBotShard";

export default class PingCommandPacketHandlers {
	@packetHandler(CommandPingPacketRes)
	async pingRes(context: PacketContext, packet: CommandPingPacketRes): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		await interaction?.editReply({
			content: i18n.t("commands:ping.discord.edit", {
				lng: interaction?.userLanguage,
				totalLatency: Date.now() - packet.clientTime,
				discordApiLatency: draftBotClient!.ws.ping,
				shardId,
				totalShards: draftBotClient!.shard!.count - 1
			})
		});
	}
}
