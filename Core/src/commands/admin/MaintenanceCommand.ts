import {
	CommandMaintenancePacketReq,
	CommandMaintenancePacketRes
} from "../../../../Lib/src/packets/commands/CommandMaintenancePacket";
import {
	DraftBotPacket, makePacket, PacketContext
} from "../../../../Lib/src/packets/DraftBotPacket";
import { draftBotInstance } from "../../index";
import { ErrorPacket } from "../../../../Lib/src/packets/commands/ErrorPacket";
import { adminCommand } from "../../core/utils/CommandUtils";
import { RightGroup } from "../../../../Lib/src/types/RightGroup";

export default class MaintenanceCommand {
	@adminCommand(CommandMaintenancePacketReq, (context: PacketContext, _packet: CommandMaintenancePacketReq): boolean => {
		return context.rightGroups?.includes(RightGroup.ADMIN) || context.rightGroups?.includes(RightGroup.MAINTENANCE);
	})
	execute(response: DraftBotPacket[], packet: CommandMaintenancePacketReq): void {
		try {
			draftBotInstance.setMaintenance(packet.enable, packet.save);

			response.push(makePacket(CommandMaintenancePacketRes, { enabled: packet.enable }));
		}
		catch (err) {
			response.push(makePacket(ErrorPacket, { message: err.message }));
		}
	}
}
