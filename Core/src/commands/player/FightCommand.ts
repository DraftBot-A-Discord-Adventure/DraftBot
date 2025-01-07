import {CommandFightPacketReq, CommandFightPacketRes} from "../../../../Lib/src/packets/commands/CommandPingPacket";
import {DraftBotPacket, makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import Player from "../../core/database/game/models/Player";
import {commandRequires, CommandUtils} from "../../core/utils/CommandUtils";
import {FightConstants} from "../../../../Lib/src/constants/FightConstants";

export default class FightCommand {
	@commandRequires(CommandFightPacketReq, {
		notBlocked: true,
		disallowedEffects: CommandUtils.DISALLOWED_EFFECTS.NOT_STARTED_OR_DEAD,
		level: FightConstants.REQUIRED_LEVEL
	})
	execute(response: DraftBotPacket[], _player: Player, packet: CommandFightPacketReq): void {
		response.push(makePacket(CommandFightPacketRes, {
			clientTime: packet.time
		}));
	}
}

