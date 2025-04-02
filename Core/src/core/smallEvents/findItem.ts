import {
	generateRandomItem, giveItemToPlayer
} from "../utils/ItemUtils";
import { SmallEventFuncs } from "../../data/SmallEvent";
import { Maps } from "../maps/Maps";
import { ItemConstants } from "../../../../Lib/src/constants/ItemConstants";
import { SmallEventConstants } from "../../../../Lib/src/constants/SmallEventConstants";
import { InventorySlots } from "../database/game/models/InventorySlot";
import { makePacket } from "../../../../Lib/src/packets/DraftBotPacket";
import { SmallEventFindItemPacket } from "../../../../Lib/src/packets/smallEvents/SmallEventFindItemPacket";

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: Maps.isOnContinent,
	executeSmallEvent: async (response, player, context): Promise<void> => {
		const itemGenerated = generateRandomItem(null, ItemConstants.RARITY.COMMON, SmallEventConstants.FIND_ITEM.MAXIMUM_RARITY);
		await giveItemToPlayer(player, itemGenerated, context, response, await InventorySlots.getOfPlayer(player.id));
		response.push(makePacket(SmallEventFindItemPacket, {}));
	}
};
