import {CommandPingPacketReq, CommandPingPacketRes} from "../../../../Lib/src/packets/commands/CommandPingPacket";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {CommandRarityPacketReq} from "../../../../Lib/src/packets/commands/CommandRarityPacket";
import {WebsocketClient} from "../../../../Lib/src/instances/WebsocketClient";

export default class PingCommand {
	@packetHandler(CommandPingPacketReq)
	execute(client: WebsocketClient, packet: CommandRarityPacketReq, context: PacketContext, response: DraftBotPacket[]): void {
		response.push(makePacket(CommandPingPacketRes, {
			latency: 0
		}));
	}
}

