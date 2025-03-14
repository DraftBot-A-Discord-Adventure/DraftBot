import {ReactionCollectorReactPacket} from "../../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {packetHandler} from "../PacketHandler";
import {DraftBotPacket, PacketContext} from "../../../../../Lib/src/packets/DraftBotPacket";
import {ReactionCollectorController} from "../../utils/ReactionsCollector";
import {ChangeBlockingReasonPacket} from "../../../../../Lib/src/packets/utils/ChangeBlockingReasonPacket";
import {BlockingUtils} from "../../utils/BlockingUtils";
import {
	ReactionCollectorResetTimerPacketReq
} from "../../../../../Lib/src/packets/interaction/ReactionCollectorResetTimer";

export default class CoreHandlers {
	@packetHandler(ReactionCollectorReactPacket)
	async reactionCollector(response: DraftBotPacket[], _context: PacketContext, packet: ReactionCollectorReactPacket): Promise<void> {
		await ReactionCollectorController.reactPacket(response, packet);
	}

	@packetHandler(ChangeBlockingReasonPacket)
	async changeBlockingReason(_response: DraftBotPacket[], context: PacketContext, packet: ChangeBlockingReasonPacket): Promise<void> {
		await BlockingUtils.changeBlockingReason(context, packet);
	}

	@packetHandler(ReactionCollectorResetTimerPacketReq)
	async reactionCollectorResetTimer(response: DraftBotPacket[], _context: PacketContext, packet: ReactionCollectorResetTimerPacketReq): Promise<void> {
		ReactionCollectorController.resetTimer(response, packet);
	}
}