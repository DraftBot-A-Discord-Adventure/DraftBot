import {
	beforeEach, describe, expect, it, vi
} from "vitest";

vi.mock("../../../../src/core/database/game/models/Player", () => ({
	default: { sequelize: { query: vi.fn() } }
}));
vi.mock("../../../../src/core/utils/ItemUtils", () => ({
	getItemByIdAndCategory: vi.fn((itemId: number, category: number) => ({
		id: itemId, category
	})),
	generateRandomItem: vi.fn(({ itemCategory }: { itemCategory: number }) => ({ id: 1000 + itemCategory }))
}));

import Player from "../../../../src/core/database/game/models/Player";
import { generateRandomItem } from "../../../../src/core/utils/ItemUtils";
import {
	clearKingGuardEquipmentCache, generateKingGuardEquipment
} from "../../../../src/core/fights/kingGuards/KingGuardEquipment";
import { ItemCategory } from "../../../../../Lib/src/constants/ItemConstants";
import { ClassConstants } from "../../../../../Lib/src/constants/ClassConstants";
import { ClassInfoConstants } from "../../../../../Lib/src/constants/ClassInfoConstants";
import { FightConstants } from "../../../../../Lib/src/constants/FightConstants";

const queryMock = vi.mocked(Player.sequelize!.query);

function equippedRow(itemCategory: ItemCategory, itemId: number): unknown {
	return {
		itemCategory,
		itemId,
		itemLevel: 2,
		itemEnchantmentId: itemCategory === ItemCategory.WEAPON ? "fireEnchant" : null
	};
}

const fullSample = [
	equippedRow(ItemCategory.WEAPON, 11),
	equippedRow(ItemCategory.ARMOR, 12),
	equippedRow(ItemCategory.POTION, 13),
	equippedRow(ItemCategory.OBJECT, 14)
];

type Replacements = {
	classIds: readonly number[];
	minLevel: number;
	maxLevel: number;
};

function queriedReplacements(): Replacements[] {
	return queryMock.mock.calls.map(call => (call[1] as { replacements: Replacements }).replacements);
}

describe("generateKingGuardEquipment", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		clearKingGuardEquipmentCache();
	});

	it("copies what real players of the guard level and class lineage have equipped", async () => {
		queryMock.mockResolvedValueOnce(fullSample as never);
		const level = 40;
		const [smallestGap] = FightConstants.KING_GUARD.EQUIPMENT_LEVEL_GAPS;

		const equipment = await generateKingGuardEquipment(level, ClassConstants.CLASSES_ID.KNIGHT);

		expect(queriedReplacements()).toEqual([
			expect.objectContaining({
				classIds: ClassInfoConstants.getClassLineage(ClassConstants.CLASSES_ID.KNIGHT),
				minLevel: level - smallestGap,
				maxLevel: level + smallestGap
			})
		]);
		expect(equipment.weapon).toEqual({
			item: {
				id: 11, category: ItemCategory.WEAPON
			},
			itemLevel: 2,
			itemEnchantmentId: "fireEnchant"
		});
		expect(equipment.armor.item.id).toBe(12);
		expect(equipment.potion.item.id).toBe(13);
		expect(equipment.object.item.id).toBe(14);
		expect(generateRandomItem).not.toHaveBeenCalled();
	});

	it("widens the level gap when a category is missing among the nearest players", async () => {
		queryMock
			.mockResolvedValueOnce(fullSample.filter(row => (row as { itemCategory: ItemCategory }).itemCategory !== ItemCategory.ARMOR) as never)
			.mockResolvedValueOnce(fullSample as never);

		const equipment = await generateKingGuardEquipment(40, ClassConstants.CLASSES_ID.KNIGHT);

		const [firstGap, secondGap] = FightConstants.KING_GUARD.EQUIPMENT_LEVEL_GAPS;
		expect(queriedReplacements().map(replacement => replacement.maxLevel - replacement.minLevel)).toEqual([firstGap * 2, secondGap * 2]);
		expect(equipment.armor.item.id).toBe(12);
	});

	it("generates the equipment by rarity when no player matches at all", async () => {
		queryMock.mockResolvedValue([] as never);

		const equipment = await generateKingGuardEquipment(40, ClassConstants.CLASSES_ID.KNIGHT);

		expect(queryMock).toHaveBeenCalledTimes(FightConstants.KING_GUARD.EQUIPMENT_LEVEL_GAPS.length);
		expect(generateRandomItem).toHaveBeenCalledTimes(4);
		expect(equipment.weapon.item.id).toBe(1000 + ItemCategory.WEAPON);
		expect(equipment.weapon.itemLevel).toBe(0);
	});

	it("reuses the cached sample instead of querying the database at every fight", async () => {
		queryMock.mockResolvedValue(fullSample as never);

		await generateKingGuardEquipment(40, ClassConstants.CLASSES_ID.KNIGHT);
		await generateKingGuardEquipment(40, ClassConstants.CLASSES_ID.VALIANT_KNIGHT);

		expect(queryMock).toHaveBeenCalledTimes(1);
	});
});
