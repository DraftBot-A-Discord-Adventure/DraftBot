import {Random} from "random-js";
import {ConstantRange} from "../Constants";

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

	/**
	 * Generates a random number in the range (both interval bounds included)
	 * @param range - typically something in constants
	 * @returns a random number in [MIN, MAX]
	 */
	public static rangedInt = (range: ConstantRange): number => RandomUtils.draftbotRandom.integer(range.MIN, range.MAX);
}