import {SmallEventFuncs} from "../../data/SmallEvent";
import {Maps} from "../maps/Maps";
import {ItemCategory, ItemConstants} from "../../../../Lib/src/constants/ItemConstants";
import {generateRandomItem, giveItemToPlayer} from "../utils/ItemUtils";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {InventorySlots} from "../database/game/models/InventorySlot";
import {SmallEventFindPotionPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventFindPotionPacket";

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: Maps.isOnContinent,
	executeSmallEvent: async (context, response, player): Promise<void> => {
		const potionGenerated = generateRandomItem(ItemCategory.POTION, ItemConstants.RARITY.COMMON, ItemConstants.RARITY.MYTHICAL);
		await giveItemToPlayer(player, potionGenerated, context, response, await InventorySlots.getOfPlayer(player.id));
		response.push(makePacket(SmallEventFindPotionPacket, {}));
	}
};