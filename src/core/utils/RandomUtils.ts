import {Random} from "random-js/dist/Random";

export class RandomUtils {
	public static draftbotRandom: Random = new (require("random-js")).Random();

	/**
	 * Generates a random number between min included and max excluded
	 * @param min
	 * @param max
	 * @returns a random number between min included and max excluded
	 */
	public static randInt = (min: number, max: number): number => RandomUtils.draftbotRandom.integer(min, max - 1);
}