import {CommandPingPacketReq, CommandPingPacketRes} from "draftbot_lib/packets/commands/CommandPingPacket";
import {DraftBotPacket} from "draftbot_lib/packets/DraftBotPacket";

export async function pingCommand(client: WebSocket, packet: CommandPingPacketReq, response: DraftBotPacket[]): Promise<void> {
    const resPacket: CommandPingPacketRes = {
        latency: 0 // TODO
    };
    response.push(packet);
}