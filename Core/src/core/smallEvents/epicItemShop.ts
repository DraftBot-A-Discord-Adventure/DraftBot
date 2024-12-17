import {Shop} from "./interfaces/Shop";
import {
	SmallEventShopAcceptPacket,
	SmallEventShopCannotBuyPacket,
	SmallEventShopRefusePacket
} from "../../../../Lib/src/packets/smallEvents/SmallEventShopPacket";
import {GenericItem} from "../../data/GenericItem";
import {RandomUtils} from "../../../../Lib/src/utils/RandomUtils";
import {SmallEventConstants} from "../../../../Lib/src/constants/SmallEventConstants";
import {generateRandomItem} from "../utils/ItemUtils";
import {ItemCategory} from "../../../../Lib/src/constants/ItemConstants";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {SmallEventFuncs} from "../../data/SmallEvent";
import {MapConstants} from "../../../../Lib/src/constants/MapConstants";
import Player from "../database/game/models/Player";

class ShopSmallEvent extends Shop<SmallEventShopAcceptPacket, SmallEventShopRefusePacket, SmallEventShopCannotBuyPacket> {
	getPriceMultiplier(player: Player): number {
		const destination = player.getDestination();
		const origin = player.getPreviousMap();
		if (destination.id === MapConstants.LOCATIONS_IDS.ROAD_OF_WONDERS || origin.id === MapConstants.LOCATIONS_IDS.ROAD_OF_WONDERS) {
			return SmallEventConstants.EPIC_ITEM_SHOP.ROAD_OF_WONDERS_MULTIPLIER;
		}
		return RandomUtils.draftbotRandom.bool(SmallEventConstants.EPIC_ITEM_SHOP.GREAT_DEAL_PROBABILITY) ?
			SmallEventConstants.EPIC_ITEM_SHOP.GREAT_DEAL_MULTIPLAYER : SmallEventConstants.EPIC_ITEM_SHOP.BASE_MULTIPLIER;
	}

	getRandomItem(): GenericItem {
		const categories = Object.values(ItemCategory).filter(
			(value): value is ItemCategory => value !== ItemCategory.POTION
		);

		const randomCategory = RandomUtils.draftbotRandom.pick(categories);

		return generateRandomItem(
			randomCategory,
			SmallEventConstants.EPIC_ITEM_SHOP.MIN_RARITY,
			SmallEventConstants.EPIC_ITEM_SHOP.MAX_RARITY
		);
	}

	getTip(): boolean {
		return RandomUtils.draftbotRandom.bool(SmallEventConstants.EPIC_ITEM_SHOP.REDUCTION_TIP_PROBABILITY) && this.itemMultiplier > SmallEventConstants.EPIC_ITEM_SHOP.ROAD_OF_WONDERS_MULTIPLIER;
	}

	getAcceptPacket(): SmallEventShopAcceptPacket {
		return makePacket(SmallEventShopAcceptPacket, {});
	}

	getRefusePacket(): SmallEventShopRefusePacket {
		return makePacket(SmallEventShopRefusePacket, {});
	}

	getCannotBuyPacket(): SmallEventShopCannotBuyPacket {
		return makePacket(SmallEventShopCannotBuyPacket, {});
	}
}

const shopSmallEvent = new ShopSmallEvent();

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: shopSmallEvent.canBeExecuted,
	executeSmallEvent: shopSmallEvent.executeSmallEvent
};
