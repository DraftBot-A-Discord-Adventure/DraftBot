import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {CommandHelpPacketReq} from "../../../../Lib/src/packets/commands/CommandHelpPacket";

export default class HelpCommand {
	@packetHandler(CommandHelpPacketReq)
	execute(): void {
	}
}