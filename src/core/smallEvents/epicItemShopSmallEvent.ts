import {generateRandomItem} from "../utils/ItemUtils";
import {RandomUtils} from "../utils/RandomUtils";
import {Translations} from "../Translations";
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
		return RandomUtils.draftbotRandom.bool(SmallEventConstants.EPIC_ITEM_SHOP.REDUCTION_TIP_PROBABILITY) && this.multiplier > SmallEventConstants.EPIC_ITEM_SHOP.ROAD_OF_WONDERS_MULTIPLIER
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

	async initiatePriceMultiplier(player: Player): Promise<void> {
		const destination = await player.getDestination();
		const origin = await player.getPreviousMap();
		let multiplier = RandomUtils.draftbotRandom.bool(SmallEventConstants.EPIC_ITEM_SHOP.GREAT_DEAL_PROBABILITY) ?
			SmallEventConstants.EPIC_ITEM_SHOP.GREAT_DEAL_MULTIPLAYER : SmallEventConstants.EPIC_ITEM_SHOP.BASE_MULTIPLIER;
		if (destination.id === MapConstants.LOCATIONS_IDS.ROAD_OF_WONDERS || origin.id === MapConstants.LOCATIONS_IDS.ROAD_OF_WONDERS) {
			multiplier = SmallEventConstants.EPIC_ITEM_SHOP.ROAD_OF_WONDERS_MULTIPLIER;
		}
		this.multiplier = multiplier;
	}

	initiateTranslationModule(language: string): void {
		this.shopTranslation = Translations.getModule("smallEvents.epicItemShop", language);
	}
}

export const smallEvent: EpicItemShopSmallEvent = new EpicItemShopSmallEvent();