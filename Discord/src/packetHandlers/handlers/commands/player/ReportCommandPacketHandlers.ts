import { packetHandler } from "../../../PacketHandler";
import {
	CommandReportBigEventResultRes,
	CommandReportErrorNoMonsterRes,
	CommandReportMonsterRewardRes,
	CommandReportRefusePveFightRes,
	CommandReportTravelSummaryRes
} from "../../../../../../Lib/src/packets/commands/CommandReportPacket";
import { PacketContext } from "../../../../../../Lib/src/packets/CrowniclesPacket";
import {
	displayMonsterReward,
	refusePveFight,
	reportResult,
	reportTravelSummary
} from "../../../../commands/player/ReportCommand";
import { handleClassicError } from "../../../../utils/ErrorUtils";

export default class ReportCommandPacketHandlers {
	@packetHandler(CommandReportBigEventResultRes)
	async reportResultRes(context: PacketContext, packet: CommandReportBigEventResultRes): Promise<void> {
		await reportResult(packet, context);
	}

	@packetHandler(CommandReportTravelSummaryRes)
	async reportTravelSummaryRes(context: PacketContext, packet: CommandReportTravelSummaryRes): Promise<void> {
		await reportTravelSummary(packet, context);
	}

	@packetHandler(CommandReportMonsterRewardRes)
	async reportMonsterRewardRes(context: PacketContext, packet: CommandReportMonsterRewardRes): Promise<void> {
		await displayMonsterReward(packet, context);
	}

	@packetHandler(CommandReportErrorNoMonsterRes)
	async reportErrorNoMonsterRes(context: PacketContext, _packet: CommandReportErrorNoMonsterRes): Promise<void> {
		await handleClassicError(context, "commands:fight.monsterNotFound");
	}

	@packetHandler(CommandReportRefusePveFightRes)
	async reportRefusePveFightRes(context: PacketContext, packet: CommandReportRefusePveFightRes): Promise<void> {
		await refusePveFight(packet, context);
	}
}
