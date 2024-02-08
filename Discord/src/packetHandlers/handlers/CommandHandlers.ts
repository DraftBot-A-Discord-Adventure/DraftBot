import {packetHandler} from "../PacketHandler";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {CommandPingPacketRes} from "../../../../Lib/src/packets/commands/CommandPingPacket";
import {WebSocket} from "ws";
import {DiscordCache} from "../../bot/DiscordCache";
import i18n from "../../translations/i18n";
import {draftBotClient, shardId} from "../../bot/DraftBotShard";
import {CommandProfilePacketRes} from "../../../../Lib/src/packets/commands/CommandProfilePacket";
import {handleCommandProfilePacketRes} from "../../commands/player/ProfileCommand";
import {CommandInventoryPacketRes} from "../../../../Lib/src/packets/commands/CommandInventoryPacket";
import {handleCommandInventoryPacketRes} from "../../commands/player/InventoryCommand";
import {handleCommandUpdatePacketRes} from "../../commands/player/UpdateCommand";
import { CommandUpdatePacketRes } from "../../../../Lib/src/packets/commands/CommandUpdatePacket";
import {CommandTestPacketReq, CommandTestPacketRes} from "../../../../Lib/src/packets/commands/CommandTestPacket";
import {handleCommandTestPacketRes} from "../../commands/player/TestCommand";

export default class CommandHandlers {
	@packetHandler(CommandPingPacketRes)

	pingRes(socket: WebSocket, packet: CommandPingPacketRes, context: PacketContext): void {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		interaction?.editReply({
			content: i18n.t("commands:ping.discord.edit", {
				lang: interaction?.channel.language,
				totalLatency: Date.now() - packet.clientTime,
				discordApiLatency: draftBotClient!.ws.ping,
				shardId: shardId,
				totalShards: draftBotClient!.shard!.count - 1 }
			)
		});
	}

	@packetHandler(CommandProfilePacketRes)
	profileRes(socket: WebSocket, packet: CommandProfilePacketRes, context: PacketContext): void {
		handleCommandProfilePacketRes(packet, context).then();
	}

	@packetHandler(CommandInventoryPacketRes)
	inventoryRes(socket: WebSocket, packet: CommandInventoryPacketRes, context: PacketContext): void {
		handleCommandInventoryPacketRes(packet, context).then();
	}

	@packetHandler(CommandUpdatePacketRes)
	updateRes(socket: WebSocket, packet: CommandUpdatePacketRes, context: PacketContext): void {
		handleCommandUpdatePacketRes(packet, context).then();
	}

	@packetHandler(CommandTestPacketRes)
	testRes(socket: WebSocket, packet: CommandTestPacketRes, context: PacketContext): void {
		handleCommandTestPacketRes(packet, context).then();
	}
}