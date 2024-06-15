import {packetHandler} from "../PacketHandler";
import {WebSocket} from "ws";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {ReactionCollectorCreationPacket} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import { ReactionCollectorBigEventData} from "../../../../Lib/src/packets/interaction/ReactionCollectorBigEvent";
import {chooseDestinationCollector, createBigEventCollector} from "../../commands/player/ReportCommand";
import {ReactionCollectorChooseDestinationData} from "../../../../Lib/src/packets/interaction/ReactionCollectorChooseDestination";
import {ReactionCollectorGoToPVEIslandData} from "../../../../Lib/src/packets/interaction/ReactionCollectorGoToPVEIsland";
import {goToPVEIslandCollector} from "../../smallEvents/goToPVEIsland";
import {ReactionCollectorLotteryData} from "../../../../Lib/src/packets/interaction/ReactionCollectorLottery";
import {lotteryCollector} from "../../smallEvents/lottery";
import {ReactionCollectorPetFree} from "../../../../Lib/src/packets/interaction/ReactionCollectorPetFree";
import {createPetFreeCollector} from "../../commands/pet/PetFreeCommand";

export default class ReactionCollectorHandler {
	@packetHandler(ReactionCollectorCreationPacket)
	async collectorCreation(socket: WebSocket, packet: ReactionCollectorCreationPacket, context: PacketContext): Promise<void> {
		switch (packet.data.type) {
		case ReactionCollectorBigEventData.name:
			await createBigEventCollector(packet, context);
			break;
		case ReactionCollectorChooseDestinationData.name:
			await chooseDestinationCollector(packet, context);
			break;
		case ReactionCollectorGoToPVEIslandData.name:
			await goToPVEIslandCollector(packet, context);
			break;
		case ReactionCollectorPetFree.name:
			await createPetFreeCollector(packet, context);
			break;
		case ReactionCollectorLotteryData.name:
			await lotteryCollector(packet, context);
			break;
		default:
			throw `Unknown collector with data: ${packet.data.type}`; // Todo error embed
		}
	}
}