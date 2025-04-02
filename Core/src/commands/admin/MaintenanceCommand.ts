import {
	CommandMaintenancePacketReq,
	CommandMaintenancePacketRes
} from "../../../../Lib/src/packets/commands/CommandMaintenancePacket";
import {
	DraftBotPacket, makePacket
} from "../../../../Lib/src/packets/DraftBotPacket";
import { draftBotInstance } from "../../index";
import { ErrorPacket } from "../../../../Lib/src/packets/commands/ErrorPacket";
import {
	commandRequires, CommandUtils
} from "../../core/utils/CommandUtils";
import { RightGroup } from "../../../../Lib/src/types/RightGroup";
import Player from "../../core/database/game/models/Player";

export default class MaintenanceCommand {
	@commandRequires(CommandMaintenancePacketReq, {
		rightGroup: RightGroup.MAINTENANCE,
		notBlocked: false,
		whereAllowed: CommandUtils.WHERE.EVERYWHERE
	})
	execute(response: DraftBotPacket[], _player: Player, packet: CommandMaintenancePacketReq): void {
		try {
			draftBotInstance.setMaintenance(packet.enable, packet.save);

			response.push(makePacket(CommandMaintenancePacketRes, { enabled: packet.enable }));
		}
		catch (err) {
			response.push(makePacket(ErrorPacket, { message: err.message }));
		}
	}
}
