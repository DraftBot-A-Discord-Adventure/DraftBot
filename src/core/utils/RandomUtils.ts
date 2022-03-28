import {Random} from "random-js/dist/Random";

export class RandomUtils {
	public static draftbotRandom: Random = new (require("random-js")).Random();

	public static randInt = (min: number, max: number) => RandomUtils.draftbotRandom.integer(min, max - 1);
}