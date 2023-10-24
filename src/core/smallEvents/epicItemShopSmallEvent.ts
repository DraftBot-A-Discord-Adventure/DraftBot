import {generateRandomItem} from "../utils/ItemUtils";
import {RandomUtils} from "../utils/RandomUtils";
import Player from "../database/game/models/Player";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {ItemConstants} from "../constants/ItemConstants";
import {MapConstants} from "../constants/MapConstants";
import {ShopSmallEvent} from "./ShopSmallEventInterface";
import {GenericItemModel} from "../database/game/models/GenericItemModel";

class EpicItemShopSmallEvent extends ShopSmallEvent {

	/**
	 * Returns the key of the intro to use
	 */
	getIntroKey(): string {
		return "intro";
	}

	/**
	 * Returns the key of the vendor name to use (here, unused)
	 */
	getVendorNameKey(): string {
		return "intro";
	}

	/**
	 * Returns the tip to display
	 */
	getTip(): string {
		return RandomUtils.draftbotRandom.bool(SmallEventConstants.EPIC_ITEM_SHOP.REDUCTION_TIP_PROBABILITY) && this.itemMultiplier > SmallEventConstants.EPIC_ITEM_SHOP.ROAD_OF_WONDERS_MULTIPLIER
			? this.shopTranslation.get("reductionTip")
			: "";
	}

	/**
	 * Returns a random item to sell
	 */
	getRandomItem(): Promise<GenericItemModel> {
		return generateRandomItem(
			RandomUtils.draftbotRandom.pick(
				Object.values(ItemConstants.CATEGORIES).filter((category) => category !== ItemConstants.CATEGORIES.POTION)
			),
			SmallEventConstants.EPIC_ITEM_SHOP.MIN_RARITY,
			SmallEventConstants.EPIC_ITEM_SHOP.MAX_RARITY
		);
	}

	/**
	 * Returns the price multiplier for the item
	 * @param player
	 */
	async getPriceMultiplier(player: Player): Promise<number> {
		const destination = await player.getDestination();
		const origin = await player.getPreviousMap();
		if (destination.id === MapConstants.LOCATIONS_IDS.ROAD_OF_WONDERS || origin.id === MapConstants.LOCATIONS_IDS.ROAD_OF_WONDERS) {
			return SmallEventConstants.EPIC_ITEM_SHOP.ROAD_OF_WONDERS_MULTIPLIER;
		}
		return RandomUtils.draftbotRandom.bool(SmallEventConstants.EPIC_ITEM_SHOP.GREAT_DEAL_PROBABILITY) ?
			SmallEventConstants.EPIC_ITEM_SHOP.GREAT_DEAL_MULTIPLAYER : SmallEventConstants.EPIC_ITEM_SHOP.BASE_MULTIPLIER;
	}

	/**
	 * Returns the key of the translation module to use
	 */
	getTranslationModuleKey(): string {
		return "epicItemShop";
	}
}

export const smallEvent: EpicItemShopSmallEvent = new EpicItemShopSmallEvent();