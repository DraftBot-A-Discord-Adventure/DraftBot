import {Constants} from "../Constants";

/**
 * Get the corresponding index in the constants of a given pet food
 * @param food
 */
export function getFoodIndexOf(food: string): number {
	return Constants.PET_FOOD_GUILD_SHOP.TYPE.indexOf(food);
}