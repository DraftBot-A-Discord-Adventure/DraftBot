import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {CommandBadgePacketReq} from "../../../../Lib/src/packets/commands/CommandBadgePacket";

export default class BadgeCommand {
	@packetHandler(CommandBadgePacketReq)
	execute(): void {}
}