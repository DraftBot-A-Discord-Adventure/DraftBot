import { QueryInterface } from "sequelize";
import { RecipeDiscoveryService } from "../../../cooking/RecipeDiscoveryService";
import { getMinCookingLevelForRecipeLevel } from "../../../../../../Lib/src/constants/CookingConstants";

/**
 * Cooking level recipes used to be unlocked by comparing their level (a tier from 1 to 8) to the raw cooking
 * level, so a player reaching cooking level 8 learned all of them. Revoke the ones the player's cooking grade
 * does not unlock yet, and unpin them; they are granted again on the cooking level up reaching the right grade.
 */
export async function up({ context }: { context: QueryInterface }): Promise<void> {
	for (const recipe of RecipeDiscoveryService.getCookingLevelRecipes()) {
		const replacements = {
			recipeId: recipe.id,
			requiredCookingLevel: getMinCookingLevelForRecipeLevel(recipe.level) ?? Number.MAX_SAFE_INTEGER
		};
		await context.sequelize.query(`
			DELETE pcr
			FROM player_cooking_recipes pcr
			JOIN players p ON p.id = pcr.playerId
			WHERE pcr.recipeId = :recipeId
				AND p.cookingLevel < :requiredCookingLevel
		`, { replacements });
		await context.sequelize.query(`
			UPDATE players
			SET pinnedCookingRecipeId = NULL
			WHERE pinnedCookingRecipeId = :recipeId
				AND cookingLevel < :requiredCookingLevel
		`, { replacements });
	}
}

export async function down(): Promise<void> {
	// No rollback: the revoked recipes were granted by mistake
}
