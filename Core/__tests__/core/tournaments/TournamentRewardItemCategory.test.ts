import {
	describe, expect, it
} from "vitest";
import { ItemCategory } from "../../../../Lib/src/constants/ItemConstants";
import { TournamentConstants } from "../../../../Lib/src/constants/TournamentConstants";
import { getTournamentRewardItemCategory } from "../../../src/core/tournaments/TournamentRewardItemCategory";

const PARTICIPANT_IDS = Array.from({ length: 24 }, (_, index) => index + 1);

function categoriesForRank(finalRank: number | null): Set<ItemCategory> {
	return new Set(PARTICIPANT_IDS.map(id => getTournamentRewardItemCategory({
		id,
		finalRank
	})));
}

describe("Tournament reward item category", () => {
	it("never gives a potion to a top ranked participant but spreads the other categories", () => {
		expect(categoriesForRank(1)).toEqual(new Set([ItemCategory.WEAPON, ItemCategory.ARMOR, ItemCategory.OBJECT]));
		expect(categoriesForRank(TournamentConstants.REWARD_ITEM_TOP_RANK_LIMIT))
			.toEqual(new Set([ItemCategory.WEAPON, ItemCategory.ARMOR, ItemCategory.OBJECT]));
	});

	it("may give any category to a participant ranked after the top ranks", () => {
		expect(categoriesForRank(TournamentConstants.REWARD_ITEM_TOP_RANK_LIMIT + 1))
			.toEqual(new Set([ItemCategory.WEAPON, ItemCategory.ARMOR, ItemCategory.POTION, ItemCategory.OBJECT]));
	});
});
