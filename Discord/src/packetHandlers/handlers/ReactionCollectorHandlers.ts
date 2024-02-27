import {packetHandler} from "../PacketHandler";
import {WebSocket} from "ws";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {ReactionCollectorCreationPacket} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import { ReactionCollectorBigEventData} from "../../../../Lib/src/packets/interaction/ReactionCollectorBigEvent";
import {createBigEventCollector} from "../../commands/player/ReportCommand";

export default class ReactionCollectorHandler {
	@packetHandler(ReactionCollectorCreationPacket)
	async collectorCreation(socket: WebSocket, packet: ReactionCollectorCreationPacket, context: PacketContext): Promise<void> {
		switch (packet.data.type) {
		case ReactionCollectorBigEventData.name:
			await createBigEventCollector(packet, context);
			break;
		default:
			throw `Unknown collector with data: ${packet.data.type}`; // Todo error embed
		}
	}
}