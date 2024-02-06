import {ReactionCollectorReactPacket} from "../../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {packetHandler} from "../PacketHandler";
import {DraftBotPacket, PacketContext} from "../../../../../Lib/src/packets/DraftBotPacket";
import {ReactionCollector} from "../../utils/ReactionsCollector";
import {WebsocketClient} from "../../../../../Lib/src/instances/WebsocketClient";

export default class CoreHandlers {
	@packetHandler(ReactionCollectorReactPacket)
	async reactionCollector(socket: WebsocketClient, packet: ReactionCollectorReactPacket, context: PacketContext, response: DraftBotPacket[]): Promise<void> {
		await ReactionCollector.reactPacket(socket, packet, context, response);
	}
}