import {Shop} from "./interfaces/Shop";
import {SmallEventShopPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventShopPacket";
import {GenericItem} from "../../data/GenericItem";
import {RandomUtils} from "../utils/RandomUtils";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {generateRandomItem} from "../utils/ItemUtils";
import {ItemRarity} from "../../../../Lib/src/constants/ItemConstants";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {SmallEventFuncs} from "../../data/SmallEvent";

class ShopSmallEvent extends Shop<SmallEventShopPacket> {
	getPriceMultiplier(): number | Promise<number> {
		return RandomUtils.draftbotRandom.bool(SmallEventConstants.SHOP.SCAM_PROBABILITY) ? SmallEventConstants.SHOP.SCAM_MULTIPLIER : SmallEventConstants.SHOP.BASE_MULTIPLIER;
	}

	getRandomItem(): GenericItem {
		return generateRandomItem(null, ItemRarity.COMMON, SmallEventConstants.SHOP.MAX_RARITY);
	}

	getSmallEventPacket(): SmallEventShopPacket {
		return makePacket(SmallEventShopPacket,{});
	}
}

const shopSmallEvent = new ShopSmallEvent();

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: shopSmallEvent.canBeExecuted,
	executeSmallEvent: shopSmallEvent.executeSmallEvent
};
