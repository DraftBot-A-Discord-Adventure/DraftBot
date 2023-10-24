import {ShopSmallEvent} from "./ShopSmallEventInterface";
import {generateRandomItem} from "../utils/ItemUtils";
import {RandomUtils} from "../utils/RandomUtils";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {ItemConstants} from "../constants/ItemConstants";
import {GenericItemModel} from "../database/game/models/GenericItemModel";

class ClassicShopSmallEvent extends ShopSmallEvent {
	getIntroKey(gender: number): string {
		return `intro.${gender}`;
	}

	getVendorNameKey(gender: number): string {
		return `names.${gender}`;
	}

	getTip(): string {
		return "";
	}

	getRandomItem(): Promise<GenericItemModel> {
		return generateRandomItem(null, ItemConstants.RARITY.COMMON, SmallEventConstants.SHOP.MAX_RARITY);
	}

	getPriceMultiplier(): number {
		return RandomUtils.draftbotRandom.bool(SmallEventConstants.SHOP.SCAM_PROBABILITY) ? SmallEventConstants.SHOP.SCAM_MULTIPLIER : SmallEventConstants.SHOP.BASE_MULTIPLIER;
	}

	getTranslationModuleKey(): string {
		return "shop";
	}
}

export const smallEvent: ClassicShopSmallEvent = new ClassicShopSmallEvent();
