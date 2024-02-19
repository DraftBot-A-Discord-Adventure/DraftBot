import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {CommandIdeaPacketReq} from "../../../../Lib/src/packets/commands/CommandIdeaPacket";

export default class IdeaCommand {
	@packetHandler(CommandIdeaPacketReq)
	execute(): void {}
}