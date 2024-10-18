import {ReactionCollectorReactPacket} from "../../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {packetHandler} from "../PacketHandler";
import {DraftBotPacket, PacketContext} from "../../../../../Lib/src/packets/DraftBotPacket";
import {ReactionCollectorController} from "../../utils/ReactionsCollector";

export default class CoreHandlers {
	@packetHandler(ReactionCollectorReactPacket)
	async reactionCollector(packet: ReactionCollectorReactPacket, context: PacketContext, response: DraftBotPacket[]): Promise<void> {
		await ReactionCollectorController.reactPacket(packet, context, response);
	}
}