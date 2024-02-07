import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {CommandUpdatePacketReq, CommandUpdatePacketRes} from "../../../../Lib/src/packets/commands/CommandUpdatePacket";
import {WebsocketClient} from "../../../../Lib/src/instances/WebsocketClient";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";

export default class UpdateCommand {
    @packetHandler(CommandUpdatePacketReq)
	execute(client: WebsocketClient, packet: CommandUpdatePacketReq, context: PacketContext, response: DraftBotPacket[]): void {
		response.push(makePacket(CommandUpdatePacketRes, {
			coreVersion: process.env.npm_package_version
		}));
	}
}