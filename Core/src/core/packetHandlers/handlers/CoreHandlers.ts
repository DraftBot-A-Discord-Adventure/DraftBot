import {ReactionCollectorReactPacket} from "../../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {packetHandler} from "../PacketHandler";
import {DraftBotPacket, PacketContext} from "../../../../../Lib/src/packets/DraftBotPacket";
import {ReactionCollectorController} from "../../utils/ReactionsCollector";
import {ChangeBlockingReasonPacket} from "../../../../../Lib/src/packets/utils/ChangeBlockingReasonPacket";
import {BlockingUtils} from "../../utils/BlockingUtils";

export default class CoreHandlers {
	@packetHandler(ReactionCollectorReactPacket)
	async reactionCollector(response: DraftBotPacket[], packet: ReactionCollectorReactPacket, context: PacketContext): Promise<void> {
		await ReactionCollectorController.reactPacket(packet, context, response);
	}

	@packetHandler(ChangeBlockingReasonPacket)
	async changeBlockingReason(_response: DraftBotPacket[], packet: ChangeBlockingReasonPacket, context: PacketContext): Promise<void> {
		await BlockingUtils.changeBlockingReason(packet, context);
	}
}