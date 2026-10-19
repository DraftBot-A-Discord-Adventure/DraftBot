import {
	afterEach, beforeEach, describe, expect, it, vi
} from "vitest";
import { RecipeDiscoveryService } from "../../../src/core/cooking/RecipeDiscoveryService";
import PlayerCookingRecipe from "../../../src/core/database/game/models/PlayerCookingRecipe";
import Player from "../../../src/core/database/game/models/Player";
import {
	getCookingGrade, RecipeDiscoverySource
} from "../../../../Lib/src/constants/CookingConstants";
import { CookingRecipeDataController } from "../../../src/data/CookingRecipeData";

function cookingLevelRecipeLevels(): number[] {
	return CookingRecipeDataController.instance.getAll()
		.filter(recipe => !recipe.discoveredByDefault && recipe.discoverySource === RecipeDiscoverySource.COOKING_LEVEL)
		.map(recipe => recipe.level);
}

async function discoveredLevelsAt(cookingLevel: number): Promise<number[]> {
	const discovered = await RecipeDiscoveryService.discoverCookingLevelRecipes({ cookingLevel } as Player);
	return discovered.map(recipe => recipe.level);
}

describe("RecipeDiscoveryService.discoverCookingLevelRecipes", () => {
	beforeEach(() => {
		vi.spyOn(PlayerCookingRecipe, "isRecipeDiscovered").mockResolvedValue(false);
		vi.spyOn(PlayerCookingRecipe, "discoverRecipe").mockResolvedValue(undefined as never);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should not grant a recipe whose level only matches the raw cooking level", async () => {
		const minRecipeLevel = Math.min(...cookingLevelRecipeLevels());

		expect(getCookingGrade(minRecipeLevel).maxRecipeLevelWithoutPenalty).toBeLessThan(minRecipeLevel);
		expect(await discoveredLevelsAt(minRecipeLevel)).toEqual([]);
	});

	it.each([
		0,
		31,
		51,
		61,
		81,
		100
	])("should grant at cooking level %i only the recipes the grade prepares without penalty", async cookingLevel => {
		const maxRecipeLevel = getCookingGrade(cookingLevel).maxRecipeLevelWithoutPenalty;
		const expectedCount = cookingLevelRecipeLevels().filter(level => level <= maxRecipeLevel).length;

		const levels = await discoveredLevelsAt(cookingLevel);

		expect(levels).toHaveLength(expectedCount);
		expect(levels.every(level => level <= maxRecipeLevel)).toBe(true);
	});
});
