import {CommandPingPacketReq, CommandPingPacketRes} from "../../../../Lib/src/packets/commands/CommandPingPacket";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {packetHandler} from "../../core/packetHandlers/PacketHandler";

export default class PingCommand {
	@packetHandler(CommandPingPacketReq)
	execute(packet: CommandPingPacketReq, context: PacketContext, response: DraftBotPacket[]): void {
		response.push(makePacket(CommandPingPacketRes, {
			clientTime: packet.time
		}));
	}
}

