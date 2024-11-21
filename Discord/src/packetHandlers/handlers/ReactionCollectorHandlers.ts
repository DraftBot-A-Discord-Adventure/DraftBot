import {packetHandler} from "../PacketHandler";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {ReactionCollectorCreationPacket} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {ReactionCollectorBigEventData} from "../../../../Lib/src/packets/interaction/ReactionCollectorBigEvent";
import {chooseDestinationCollector, createBigEventCollector} from "../../commands/player/ReportCommand";
import {ReactionCollectorChooseDestinationData} from "../../../../Lib/src/packets/interaction/ReactionCollectorChooseDestination";
import {ReactionCollectorGoToPVEIslandData} from "../../../../Lib/src/packets/interaction/ReactionCollectorGoToPVEIsland";
import {goToPVEIslandCollector} from "../../smallEvents/goToPVEIsland";
import {ReactionCollectorLotteryData} from "../../../../Lib/src/packets/interaction/ReactionCollectorLottery";
import {lotteryCollector} from "../../smallEvents/lottery";
import {ReactionCollectorPetFreeData} from "../../../../Lib/src/packets/interaction/ReactionCollectorPetFree";
import {createPetFreeCollector} from "../../commands/pet/PetFreeCommand";
import {ReactionCollectorInteractOtherPlayersPoorData} from "../../../../Lib/src/packets/interaction/ReactionCollectorInteractOtherPlayers";
import {interactOtherPlayersCollector} from "../../smallEvents/interactOtherPlayers";
import {ReactionCollectorWitchData} from "../../../../Lib/src/packets/interaction/ReactionCollectorWitch";
import {witchCollector} from "../../smallEvents/witch";
import {ReactionCollectorItemChoiceData} from "../../../../Lib/src/packets/interaction/ReactionCollectorItemChoice";
import {itemAcceptCollector, itemChoiceCollector} from "../../inventory/ItemCollectors";
import {ReactionCollectorItemAcceptData} from "../../../../Lib/src/packets/interaction/ReactionCollectorItemAccept";
import {ReactionCollectorGuildCreateData} from "../../../../Lib/src/packets/interaction/ReactionCollectorGuildCreate";
import {createGuildCreateCollector} from "../../commands/guild/GuildCreateCommand";
import {ReactionCollectorShopData} from "../../../../Lib/src/packets/interaction/ReactionCollectorShop";
import {shopCollector, shopInventoryExtensionCollector} from "../../commands/player/ShopCommand";
import {ReactionCollectorBuyCategorySlotData} from "../../../../Lib/src/packets/interaction/ReactionCollectorBuyCategorySlot";
import {ReactionCollectorCartData} from "../../../../Lib/src/packets/interaction/ReactionCollectorCart";
import {cartCollector} from "../../smallEvents/cart";
import {ReactionCollectorFightPetData} from "../../../../Lib/src/packets/interaction/ReactionCollectorFightPet";
import {fightPetCollector} from "../../smallEvents/fightPet";

export default class ReactionCollectorHandler {
	@packetHandler(ReactionCollectorCreationPacket)
	async collectorCreation(packet: ReactionCollectorCreationPacket, context: PacketContext): Promise<void> {
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
		case ReactionCollectorPetFreeData.name:
			await createPetFreeCollector(packet, context);
			break;
		case ReactionCollectorGuildCreateData.name:
			await createGuildCreateCollector(packet, context);
			break;
		case ReactionCollectorLotteryData.name:
			await lotteryCollector(packet, context);
			break;
		case ReactionCollectorInteractOtherPlayersPoorData.name:
			await interactOtherPlayersCollector(packet, context);
			break;
		case ReactionCollectorWitchData.name:
			await witchCollector(packet, context);
			break;
		case ReactionCollectorItemChoiceData.name:
			await itemChoiceCollector(packet, context);
			break;
		case ReactionCollectorItemAcceptData.name:
			await itemAcceptCollector(packet, context);
			break;
		case ReactionCollectorShopData.name:
			await shopCollector(packet, context);
			break;
		case ReactionCollectorBuyCategorySlotData.name:
			await shopInventoryExtensionCollector(packet, context);
			break;
		case ReactionCollectorCartData.name:
			await cartCollector(packet, context);
			break;
		case ReactionCollectorFightPetData.name:
			await fightPetCollector(packet, context);
			break;
		default:
			throw `Unknown collector with data: ${packet.data.type}`; // Todo error embed
		}
	}
}