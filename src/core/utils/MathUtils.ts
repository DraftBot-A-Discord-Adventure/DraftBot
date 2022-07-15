/**
 * Math functions
 */
export class MathUtils {

	/**
	 * this function takes both end of an interval and a percentage and returns the value of the interval
	 * @param min
	 * @param max
	 * @param percentage
	 */
	public static getIntervalValue(min: number, max: number, percentage: number): number {
		// cap the percentage between 0 and 1
		percentage = percentage > 1 ? 1 : percentage < 0 ? 0 : percentage;
		return min + (max - min) * percentage;
	}
}