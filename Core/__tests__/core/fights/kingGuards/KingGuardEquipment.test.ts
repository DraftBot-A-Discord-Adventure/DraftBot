import {
	describe, expect, it
} from "vitest";
import {
	generateKingGuardEquipment, getKingGuardRarityRange
} from "../../../../src/core/fights/kingGuards/KingGuardEquipment";
import {
	FightItemNatures, ItemCategory, ItemConstants, ItemRarity
} from "../../../../../Lib/src/constants/ItemConstants";
import { FightConstants } from "../../../../../Lib/src/constants/FightConstants";
import { ItemEnchantment } from "../../../../../Lib/src/types/ItemEnchantment";

describe("getKingGuardRarityRange", () => {
	it("follows the progression of real players: higher levels wear rarer items", () => {
		const lowLevel = getKingGuardRarityRange(FightConstants.REQUIRED_LEVEL);
		const midLevel = getKingGuardRarityRange(60);
		const highLevel = getKingGuardRarityRange(120);

		expect(lowLevel.maxRarity).toBeLessThan(midLevel.maxRarity);
		expect(midLevel.maxRarity).toBeLessThan(highLevel.maxRarity);
		expect(midLevel.maxRarity - midLevel.minRarity).toBe(2 * FightConstants.KING_GUARD.EQUIPMENT_RARITY.SPREAD);
	});

	it("stays within existing rarities at both ends", () => {
		expect(getKingGuardRarityRange(0).minRarity).toBe(ItemRarity.COMMON);
		expect(getKingGuardRarityRange(1000).maxRarity).toBe(ItemRarity.MYTHICAL);
	});
});

describe("generateKingGuardEquipment", () => {
	it.each([FightConstants.REQUIRED_LEVEL, 30, 60, 100, 150, 200])("equips a level %i guard with items of its rarity range", level => {
		const range = getKingGuardRarityRange(level);

		for (let i = 0; i < 30; i++) {
			const equipment = generateKingGuardEquipment(level);

			for (const item of [equipment.weapon.item, equipment.armor.item, equipment.object.item]) {
				expect(item.rarity).toBeGreaterThanOrEqual(range.minRarity);
				expect(item.rarity).toBeLessThanOrEqual(range.maxRarity);
			}
			expect(FightItemNatures).toContain(equipment.object.item.nature);
			expect(equipment.potion.item.id === 0 || FightItemNatures.includes(equipment.potion.item.nature)).toBe(true);
		}
	});

	it("upgrades and enchants the weapon and the armor at random", () => {
		const slots = Array.from({ length: 400 }, () => generateKingGuardEquipment(60))
			.flatMap(equipment => [[ItemCategory.WEAPON, equipment.weapon], [ItemCategory.ARMOR, equipment.armor]] as const);

		expect(new Set(slots.map(([, slot]) => slot.itemLevel))).toEqual(new Set(Array.from({ length: ItemConstants.MAX_UPGRADE_LEVEL + 1 }, (_, level) => level)));
		const enchanted = slots.filter(([, slot]) => slot.itemEnchantmentId !== null);
		expect(enchanted.length / slots.length).toBeCloseTo(FightConstants.KING_GUARD.ENCHANTMENT_PROBABILITY, 1);
		for (const [category, slot] of enchanted) {
			expect(ItemEnchantment.getById(slot.itemEnchantmentId!)?.kind.slot).toBe(category);
		}
	});
});
