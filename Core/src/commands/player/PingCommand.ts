import {
	CommandPingPacketReq, CommandPingPacketRes
} from "../../../../Lib/src/packets/commands/CommandPingPacket";
import {
	DraftBotPacket, makePacket
} from "../../../../Lib/src/packets/DraftBotPacket";
import Player from "../../core/database/game/models/Player";
import {
	commandRequires, CommandUtils
} from "../../core/utils/CommandUtils";

export default class PingCommand {
	@commandRequires(CommandPingPacketReq, {
		notBlocked: false,
		whereAllowed: CommandUtils.WHERE.EVERYWHERE
	})
	execute(response: DraftBotPacket[], _player: Player, packet: CommandPingPacketReq): void {
		response.push(makePacket(CommandPingPacketRes, {
			clientTime: packet.time
		}));
	}
}

