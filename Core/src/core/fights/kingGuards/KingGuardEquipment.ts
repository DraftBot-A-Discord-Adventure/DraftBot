import { PlayerActiveObjects } from "../../database/game/models/PlayerActiveObjects";
import { FightConstants } from "../../../../../Lib/src/constants/FightConstants";
import {
	FightItemNatures, ItemCategory, ItemConstants, ItemRarity
} from "../../../../../Lib/src/constants/ItemConstants";
import { RandomUtils } from "../../../../../Lib/src/utils/RandomUtils";
import { generateRandomItem } from "../../utils/ItemUtils";
import {
	EnchantmentSlot, ItemEnchantment
} from "../../../../../Lib/src/types/ItemEnchantment";
import { Weapon } from "../../../data/Weapon";
import { Armor } from "../../../data/Armor";
import {
	Potion, PotionDataController
} from "../../../data/Potion";
import { ObjectItem } from "../../../data/ObjectItem";

const NO_POTION_ID = 0;

export type RarityRange = {
	minRarity: ItemRarity;
	maxRarity: ItemRarity;
};

type MainItemSlot<T extends Weapon | Armor> = {
	item: T;
	itemLevel: number;
	itemEnchantmentId: string | null;
};

function clampRarity(rarity: number): ItemRarity {
	return Math.min(ItemRarity.MYTHICAL, Math.max(ItemRarity.COMMON, rarity));
}

/**
 * Rarity range the equipment of a king guard is drawn in: real players gain about one rarity every few levels
 * @param level The level of the king guard
 */
export function getKingGuardRarityRange(level: number): RarityRange {
	const {
		AT_LEVEL_ZERO, LEVELS_PER_RARITY, SPREAD
	} = FightConstants.KING_GUARD.EQUIPMENT_RARITY;
	const expectedRarity = Math.round(AT_LEVEL_ZERO + level / LEVELS_PER_RARITY);
	return {
		minRarity: clampRarity(expectedRarity - SPREAD),
		maxRarity: clampRarity(expectedRarity + SPREAD)
	};
}

/**
 * Generate a weapon or an armor of a rarity drawn uniformly in the range, with a random upgrade level and maybe a random enchantment
 */
function generateMainItem<T extends Weapon | Armor>(category: EnchantmentSlot, rarityRange: RarityRange): MainItemSlot<T> {
	const rarity = RandomUtils.crowniclesRandom.integer(rarityRange.minRarity, rarityRange.maxRarity);
	const item = generateRandomItem({
		itemCategory: category,
		minRarity: rarity,
		maxRarity: rarity
	});
	return {
		item: item as T,
		itemLevel: RandomUtils.crowniclesRandom.integer(0, ItemConstants.MAX_UPGRADE_LEVEL),
		itemEnchantmentId: RandomUtils.crowniclesRandom.bool(FightConstants.KING_GUARD.ENCHANTMENT_PROBABILITY)
			? ItemEnchantment.getRandomEnchantmentForSlot(category).id
			: null
	};
}

/**
 * Generate a potion or an object boosting attack, defense or speed
 */
function generateFightSupportItem<T extends Potion | ObjectItem>(category: ItemCategory.POTION | ItemCategory.OBJECT, rarityRange: RarityRange): T {
	return generateRandomItem({
		itemCategory: category,
		...rarityRange,
		subType: RandomUtils.crowniclesRandom.pick(FightItemNatures)
	}) as T;
}

/**
 * Generate the equipment of a king guard, as strong as what real players of its level wear.
 * Item stats are capped by the class and level of their owner, which keeps them coherent with the guard.
 * @param level The level of the king guard
 */
export function generateKingGuardEquipment(level: number): PlayerActiveObjects {
	const rarityRange = getKingGuardRarityRange(level);
	const hasFightPotion = RandomUtils.crowniclesRandom.bool(FightConstants.KING_GUARD.FIGHT_POTION_PROBABILITY);
	return {
		weapon: generateMainItem<Weapon>(ItemCategory.WEAPON, rarityRange),
		armor: generateMainItem<Armor>(ItemCategory.ARMOR, rarityRange),
		potion: {
			item: hasFightPotion
				? generateFightSupportItem<Potion>(ItemCategory.POTION, rarityRange)
				: PotionDataController.instance.getById(NO_POTION_ID)!
		},
		object: { item: generateFightSupportItem<ObjectItem>(ItemCategory.OBJECT, rarityRange) }
	};
}
