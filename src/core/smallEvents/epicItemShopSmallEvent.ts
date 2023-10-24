import {generateRandomItem} from "../utils/ItemUtils";
import {RandomUtils} from "../utils/RandomUtils";
import Player from "../database/game/models/Player";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {ItemConstants} from "../constants/ItemConstants";
import {MapConstants} from "../constants/MapConstants";
import {ShopSmallEvent} from "./ShopSmallEventInterface";
import {GenericItemModel} from "../database/game/models/GenericItemModel";

class EpicItemShopSmallEvent extends ShopSmallEvent {
	getIntroKey(): string {
		return "intro";
	}

	getVendorNameKey(): string {
		return "intro"; // Unused but required
	}

	getTip(): string {
		return RandomUtils.draftbotRandom.bool(SmallEventConstants.EPIC_ITEM_SHOP.REDUCTION_TIP_PROBABILITY) && this.itemMultiplier > SmallEventConstants.EPIC_ITEM_SHOP.ROAD_OF_WONDERS_MULTIPLIER
			? this.shopTranslation.get("reductionTip")
			: "";
	}

	getRandomItem(): Promise<GenericItemModel> {
		return generateRandomItem(
			RandomUtils.draftbotRandom.pick(
				Object.values(ItemConstants.CATEGORIES).filter((category) => category !== ItemConstants.CATEGORIES.POTION)
			),
			SmallEventConstants.EPIC_ITEM_SHOP.MIN_RARITY,
			SmallEventConstants.EPIC_ITEM_SHOP.MAX_RARITY
		);
	}

	async getPriceMultiplier(player: Player): Promise<number> {
		const destination = await player.getDestination();
		const origin = await player.getPreviousMap();
		if (destination.id === MapConstants.LOCATIONS_IDS.ROAD_OF_WONDERS || origin.id === MapConstants.LOCATIONS_IDS.ROAD_OF_WONDERS) {
			return SmallEventConstants.EPIC_ITEM_SHOP.ROAD_OF_WONDERS_MULTIPLIER;
		}
		return RandomUtils.draftbotRandom.bool(SmallEventConstants.EPIC_ITEM_SHOP.GREAT_DEAL_PROBABILITY) ?
			SmallEventConstants.EPIC_ITEM_SHOP.GREAT_DEAL_MULTIPLAYER : SmallEventConstants.EPIC_ITEM_SHOP.BASE_MULTIPLIER;
	}

	getTranslationModuleKey(): string {
		return "epicItemShop";
	}
}

export const smallEvent: EpicItemShopSmallEvent = new EpicItemShopSmallEvent();