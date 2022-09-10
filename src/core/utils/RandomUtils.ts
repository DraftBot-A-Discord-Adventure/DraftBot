import {Random} from "random-js";

/**
 * Functions concerning pseudo-randomness
 */
export class RandomUtils {
	/**
	 * redefining the random js library
	 */
	public static draftbotRandom: Random = new Random();

	/**
	 * Generates a random number between min included and max excluded
	 * @param min
	 * @param max
	 * @returns a random number between min included and max excluded
	 */
	public static randInt = (min: number, max: number): number => RandomUtils.draftbotRandom.integer(min, max - 1);
}