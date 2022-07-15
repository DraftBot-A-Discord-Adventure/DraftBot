import {Constants} from "../Constants";

export function getFoodIndexOf(food: string): number {
	return Constants.PET_FOOD_GUILD_SHOP.TYPE.indexOf(food);
}