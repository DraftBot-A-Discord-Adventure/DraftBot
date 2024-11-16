import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {
	CommandMaintenancePacketReq,
	CommandMaintenancePacketRes
} from "../../../../Lib/src/packets/commands/CommandMaintenancePacket";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {draftBotInstance} from "../../index";
import {ErrorPacket} from "../../../../Lib/src/packets/commands/ErrorPacket";
import {CommandUtils} from "../../core/utils/CommandUtils";
import {Players} from "../../core/database/game/models/Player";
import {RightGroup} from "../../../../Lib/src/enums/RightGroup";

export default class MaintenanceCommand {
	@packetHandler(CommandMaintenancePacketReq)
	async execute(packet: CommandMaintenancePacketReq, context: PacketContext, response: DraftBotPacket[]): Promise<void> {
		const player = await Players.getByKeycloakId(context.keycloakId);

		if (!await CommandUtils.verifyCommandRequirements(player, context, response, { rightGroup: RightGroup.MAINTENANCE })) {
			return;
		}

		try {
			draftBotInstance.setMaintenance(packet.enable, packet.save);

			response.push(makePacket(CommandMaintenancePacketRes, { enabled: packet.enable }));
		}
		catch (err) {
			response.push(makePacket(ErrorPacket, { message: err.message }));
		}
	}
}