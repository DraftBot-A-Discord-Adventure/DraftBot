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
import {ReactionCollectorGuildInviteData} from "../../../../Lib/src/packets/interaction/ReactionCollectorGuildInvite.js";
import {createGuildInviteCollector} from "../../commands/guild/GuildInviteCommand.js";
import {ReactionCollectorShopData} from "../../../../Lib/src/packets/interaction/ReactionCollectorShop";
import {shopCollector, shopInventoryExtensionCollector} from "../../commands/player/ShopCommand";
import {ReactionCollectorBuyCategorySlotData} from "../../../../Lib/src/packets/interaction/ReactionCollectorBuyCategorySlot";
import {ReactionCollectorCartData} from "../../../../Lib/src/packets/interaction/ReactionCollectorCart";
import {cartCollector} from "../../smallEvents/cart";
import {ReactionCollectorFightPetData} from "../../../../Lib/src/packets/interaction/ReactionCollectorFightPet";
import {fightPetCollector} from "../../smallEvents/fightPet";
import {PacketListenerCallbackClient} from "../../../../Lib/src/packets/PacketListener";
import {ReactionCollectorGuildKickData} from "../../../../Lib/src/packets/interaction/ReactionCollectorGuildKick";
import {createGuildKickCollector} from "../../commands/guild/GuildKickCommand";
import {ReactionCollectorGobletsGameData} from "../../../../Lib/src/packets/interaction/ReactionCollectorGobletsGame";
import {gobletsGameCollector} from "../../smallEvents/gobletsGame";
import {createUnlockCollector} from "../../commands/player/UnlockCommand";
import {ReactionCollectorUnlockData} from "../../../../Lib/src/packets/interaction/ReactionCollectorUnlock";
import {smallShopCollector} from "../../smallEvents/shop";
import {epicItemShopCollector} from "../../smallEvents/epicItemShop";
import {ReactionCollectorEpicShopSmallEventData} from "../../../../Lib/src/packets/interaction/ReactionCollectorEpicShopSmallEvent";
import {ReactionCollectorShopSmallEventData} from "../../../../Lib/src/packets/interaction/ReactionCollectorShopSmallEvent";
import {ReactionCollectorSkipMissionShopItemData} from "../../../../Lib/src/packets/interaction/ReactionCollectorSkipMissionShopItem";
import {skipMissionShopItemCollector} from "../../commands/mission/MissionShop";
import {createGuildElderCollector} from "../../commands/guild/GuildElderCommand";
import {ReactionCollectorGuildElderData} from "../../../../Lib/src/packets/interaction/ReactionCollectorGuildElder";
import {ReactionCollectorGuildLeaveData} from "../../../../Lib/src/packets/interaction/ReactionCollectorGuildLeave";
import {createGuildLeaveCollector} from "../../commands/guild/GuildLeaveCommand";
import {ReactionCollectorSwitchItemData} from "../../../../Lib/src/packets/interaction/ReactionCollectorSwitchItem";
import {switchItemCollector} from "../../commands/player/SwitchCommand";
import {ReactionCollectorGuildElderRemoveData} from "../../../../Lib/src/packets/interaction/ReactionCollectorGuildElderRemove";
import {createGuildElderRemoveCollector} from "../../commands/guild/GuildElderRemoveCommand";

export default class ReactionCollectorHandler {

	static collectorMap: Map<string, PacketListenerCallbackClient<ReactionCollectorCreationPacket>>;

	static initCollectorMap(): void {
		ReactionCollectorHandler.collectorMap = new Map();
		ReactionCollectorHandler.collectorMap.set(ReactionCollectorBigEventData.name, createBigEventCollector);
		ReactionCollectorHandler.collectorMap.set(ReactionCollectorChooseDestinationData.name, chooseDestinationCollector);
		ReactionCollectorHandler.collectorMap.set(ReactionCollectorGoToPVEIslandData.name, goToPVEIslandCollector);
		ReactionCollectorHandler.collectorMap.set(ReactionCollectorPetFreeData.name, createPetFreeCollector);
		ReactionCollectorHandler.collectorMap.set(ReactionCollectorGuildCreateData.name, createGuildCreateCollector);
		ReactionCollectorHandler.collectorMap.set(ReactionCollectorGuildKickData.name, createGuildKickCollector);
		ReactionCollectorHandler.collectorMap.set(ReactionCollectorGuildElderData.name, createGuildElderCollector);
		ReactionCollectorHandler.collectorMap.set(ReactionCollectorGuildElderRemoveData.name, createGuildElderRemoveCollector);
		ReactionCollectorHandler.collectorMap.set(ReactionCollectorGuildLeaveData.name, createGuildLeaveCollector);
		ReactionCollectorHandler.collectorMap.set(ReactionCollectorLotteryData.name, lotteryCollector);
		ReactionCollectorHandler.collectorMap.set(ReactionCollectorInteractOtherPlayersPoorData.name, interactOtherPlayersCollector);
		ReactionCollectorHandler.collectorMap.set(ReactionCollectorWitchData.name, witchCollector);
		ReactionCollectorHandler.collectorMap.set(ReactionCollectorItemChoiceData.name, itemChoiceCollector);
		ReactionCollectorHandler.collectorMap.set(ReactionCollectorItemAcceptData.name, itemAcceptCollector);
		ReactionCollectorHandler.collectorMap.set(ReactionCollectorShopData.name, shopCollector);
		ReactionCollectorHandler.collectorMap.set(ReactionCollectorBuyCategorySlotData.name, shopInventoryExtensionCollector);
		ReactionCollectorHandler.collectorMap.set(ReactionCollectorCartData.name, cartCollector);
		ReactionCollectorHandler.collectorMap.set(ReactionCollectorFightPetData.name, fightPetCollector);
		ReactionCollectorHandler.collectorMap.set(ReactionCollectorGuildInviteData.name, createGuildInviteCollector);
		ReactionCollectorHandler.collectorMap.set(ReactionCollectorGobletsGameData.name, gobletsGameCollector);
		ReactionCollectorHandler.collectorMap.set(ReactionCollectorUnlockData.name, createUnlockCollector);
		ReactionCollectorHandler.collectorMap.set(ReactionCollectorShopSmallEventData.name, smallShopCollector);
		ReactionCollectorHandler.collectorMap.set(ReactionCollectorEpicShopSmallEventData.name, epicItemShopCollector);
		ReactionCollectorHandler.collectorMap.set(ReactionCollectorSkipMissionShopItemData.name, skipMissionShopItemCollector);
		ReactionCollectorHandler.collectorMap.set(ReactionCollectorSwitchItemData.name, switchItemCollector);
	}

	@packetHandler(ReactionCollectorCreationPacket)
	async collectorCreation(context: PacketContext, packet: ReactionCollectorCreationPacket): Promise<void> {
		if (!ReactionCollectorHandler.collectorMap) {
			ReactionCollectorHandler.initCollectorMap();
		}
		const collector = ReactionCollectorHandler.collectorMap.get(packet.data.type);
		if (!collector) {
			throw `Unknown collector with data: ${packet.data.type}`; // Todo error embed
		}
		await collector(context, packet);
	}
}