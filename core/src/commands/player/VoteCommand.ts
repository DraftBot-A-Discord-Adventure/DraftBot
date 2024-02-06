import {CommandVotePacketReq} from "../../../../Lib/src/packets/commands/CommandVotePacket";
import {packetHandler} from "../../core/packetHandlers/PacketHandler";

export default class VoteCommand {
	@packetHandler(CommandVotePacketReq)
	execute(): void {}
}