import {ShopSmallEvent} from "./ShopSmallEventInterface";
import {generateRandomItem} from "../utils/ItemUtils";
import {RandomUtils} from "../utils/RandomUtils";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {ItemConstants} from "../constants/ItemConstants";
import {GenericItemModel} from "../database/game/models/GenericItemModel";

class ClassicShopSmallEvent extends ShopSmallEvent {
	/**
	 * Returns the key of the intro to use
	 * @param gender
	 */
	getIntroKey(gender: number): string {
		return `intro.${gender}`;
	}

	/**
	 * Returns the key of the vendor name to use
	 * @param gender
	 */
	getVendorNameKey(gender: number): string {
		return `names.${gender}`;
	}

	/**
	 * Returns the tip to display (here, nothing)
	 */
	getTip(): string {
		return "";
	}

	/**
	 * Returns a random item to sell
	 */
	getRandomItem(): Promise<GenericItemModel> {
		return generateRandomItem(null, ItemConstants.RARITY.COMMON, SmallEventConstants.SHOP.MAX_RARITY);
	}

	/**
	 * Returns the price multiplier for the item
	 */
	getPriceMultiplier(): number {
		return RandomUtils.draftbotRandom.bool(SmallEventConstants.SHOP.SCAM_PROBABILITY) ? SmallEventConstants.SHOP.SCAM_MULTIPLIER : SmallEventConstants.SHOP.BASE_MULTIPLIER;
	}

	/**
	 * Returns the key of the translation module to use
	 */
	getTranslationModuleKey(): string {
		return "shop";
	}
}

export const smallEvent: ClassicShopSmallEvent = new ClassicShopSmallEvent();
