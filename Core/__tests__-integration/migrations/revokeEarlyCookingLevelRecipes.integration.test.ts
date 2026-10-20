import {
	afterAll, beforeAll, describe, expect, it
} from "vitest";
import type {
	ModelStatic, QueryInterface
} from "sequelize";
import {
	CoreTestEnvironment, loadProductionModule, setupCoreForTests
} from "../_coreSetup";
import type { Player as PlayerType } from "../../src/core/database/game/models/Player";
import type PlayerCookingRecipeType from "../../src/core/database/game/models/PlayerCookingRecipe";
import type { CookingRecipe } from "../../../Lib/src/types/CookingRecipe";
import { getMinCookingLevelForRecipeLevel } from "../../../Lib/src/constants/CookingConstants";

type RecipeDiscoveryServiceModule = typeof import("../../src/core/cooking/RecipeDiscoveryService");
type MigrationModule = typeof import("../../src/core/database/game/migrations/077-revoke-early-cooking-level-recipes");

describe("migration 077: revoke cooking level recipes unlocked before the right grade", () => {
	let env: CoreTestEnvironment;
	let Player: ModelStatic<PlayerType>;
	let PlayerCookingRecipe: ModelStatic<PlayerCookingRecipeType>;
	let migration: MigrationModule;
	let cookingLevelRecipes: CookingRecipe[];

	beforeAll(async () => {
		env = await setupCoreForTests("revokecookingrecipes");
		const models = env.crownicles.gameDatabase.sequelize.models;
		Player = models.Player as ModelStatic<PlayerType>;
		PlayerCookingRecipe = models.PlayerCookingRecipe as ModelStatic<PlayerCookingRecipeType>;
		migration = loadProductionModule<MigrationModule>("core/database/game/migrations/077-revoke-early-cooking-level-recipes");
		cookingLevelRecipes = loadProductionModule<RecipeDiscoveryServiceModule>("core/cooking/RecipeDiscoveryService")
			.RecipeDiscoveryService.getCookingLevelRecipes();
	});

	afterAll(async () => {
		await env?.teardown();
	});

	async function createPlayerKnowingEveryCookingLevelRecipe(keycloakId: string, cookingLevel: number, pinnedRecipe: CookingRecipe): Promise<PlayerType> {
		const player = await Player.create({
			keycloakId,
			cookingLevel,
			pinnedCookingRecipeId: pinnedRecipe.id
		});
		await PlayerCookingRecipe.bulkCreate(cookingLevelRecipes.map(recipe => ({
			playerId: player.id,
			recipeId: recipe.id
		})));
		return player;
	}

	async function knownRecipeIds(playerId: number): Promise<string[]> {
		const rows = await PlayerCookingRecipe.findAll({ where: { playerId } });
		return rows.map(row => row.recipeId).sort();
	}

	function recipeIdsUnlockedAt(cookingLevel: number): string[] {
		return cookingLevelRecipes
			.filter(recipe => cookingLevel >= (getMinCookingLevelForRecipeLevel(recipe.level) ?? Infinity))
			.map(recipe => recipe.id)
			.sort();
	}

	it("keeps only the recipes unlocked by the player's grade and unpins the revoked ones", async () => {
		const highestRecipe = cookingLevelRecipes[cookingLevelRecipes.length - 1];
		const lowestRecipe = cookingLevelRecipes[0];
		const lowestRecipeLevel = getMinCookingLevelForRecipeLevel(lowestRecipe.level)!;
		const beginner = await createPlayerKnowingEveryCookingLevelRecipe("revoke-beginner", lowestRecipe.level, highestRecipe);
		const intermediate = await createPlayerKnowingEveryCookingLevelRecipe("revoke-intermediate", lowestRecipeLevel, lowestRecipe);
		const master = await createPlayerKnowingEveryCookingLevelRecipe("revoke-master", 100, highestRecipe);

		await migration.up({ context: env.crownicles.gameDatabase.sequelize.getQueryInterface() as QueryInterface });

		expect(await knownRecipeIds(beginner.id)).toEqual([]);
		expect(await knownRecipeIds(intermediate.id)).toEqual(recipeIdsUnlockedAt(lowestRecipeLevel));
		expect(await knownRecipeIds(intermediate.id)).not.toContain(highestRecipe.id);
		expect(await knownRecipeIds(master.id)).toEqual(recipeIdsUnlockedAt(100));
		expect((await Player.findByPk(beginner.id))!.pinnedCookingRecipeId).toBeNull();
		expect((await Player.findByPk(intermediate.id))!.pinnedCookingRecipeId).toBe(lowestRecipe.id);
		expect((await Player.findByPk(master.id))!.pinnedCookingRecipeId).toBe(highestRecipe.id);
	});
});
