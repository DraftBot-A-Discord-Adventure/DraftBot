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
import {ItemRarity} from "../../../../Lib/src/constants/ItemConstants";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {SmallEventFuncs} from "../../data/SmallEvent";
import {
	ReactionCollectorShopSmallEvent,
	ReactionCollectorShopSmallEventData
} from "../../../../Lib/src/packets/interaction/ReactionCollectorShopSmallEvent";

class ShopSmallEvent extends Shop<SmallEventShopAcceptPacket, SmallEventShopRefusePacket, SmallEventShopCannotBuyPacket, ReactionCollectorShopSmallEvent> {
	getPriceMultiplier(): number | Promise<number> {
		return RandomUtils.draftbotRandom.bool(SmallEventConstants.SHOP.SCAM_PROBABILITY) ? SmallEventConstants.SHOP.SCAM_MULTIPLIER : SmallEventConstants.SHOP.BASE_MULTIPLIER;
	}

	getRandomItem(): GenericItem {
		return generateRandomItem(null, ItemRarity.COMMON, SmallEventConstants.SHOP.MAX_RARITY);
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

	getPopulatedReactionCollector(basePacket: ReactionCollectorShopSmallEventData): ReactionCollectorShopSmallEvent {
		return new ReactionCollectorShopSmallEvent(basePacket);
	}
}

const shopSmallEvent = new ShopSmallEvent();

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: shopSmallEvent.canBeExecuted,
	executeSmallEvent: shopSmallEvent.executeSmallEvent
};
