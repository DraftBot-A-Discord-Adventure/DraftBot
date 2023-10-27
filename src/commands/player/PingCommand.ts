import {CommandPingPacketReq, CommandPingPacketRes} from "@Lib/src/packets/commands/CommandPingPacket";
import {DraftBotPacket} from "@Lib/src/packets/DraftBotPacket";

export async function pingCommand(client: WebSocket, packet: CommandPingPacketReq, response: DraftBotPacket[]): Promise<void> {
	const resPacket: CommandPingPacketRes = {
		latency: 0 // TODO
	};
	response.push(packet);
}