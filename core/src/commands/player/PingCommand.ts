import {CommandPingPacketReq, CommandPingPacketRes} from "../../../../Lib/src/packets/commands/CommandPingPacket";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {WebsocketClient} from "../../../../Lib/src/instances/WebsocketClient";

export default class PingCommand {
	@packetHandler(CommandPingPacketReq)
	execute(client: WebsocketClient, packet: CommandPingPacketReq, context: PacketContext, response: DraftBotPacket[]): void {
		response.push(makePacket(CommandPingPacketRes, {
			clientTime: packet.time
		}));
	}
}

