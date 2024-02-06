import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {CommandBadgesPacketReq} from "../../../../Lib/src/packets/commands/CommandBadgesPacket";

export default class BadgesCommand {
	@packetHandler(CommandBadgesPacketReq)
	execute(): void {}
}