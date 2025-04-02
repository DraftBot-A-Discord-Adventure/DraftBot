import {
	ItemCategory, ItemNature, ItemRarity
} from "../constants/ItemConstants";

export interface ItemWithDetails {
	category: ItemCategory;

	id: number;

	rarity: ItemRarity;

	detailsSupportItem?: {
		nature: ItemNature;
		power: number;
	};

	detailsMainItem?: {
		stats: {
			attack: number;
			defense: number;
			speed: number;
		};
	};

	maxStats?: {
		attack: number;
		defense: number;
		speed: number;
	};
}
