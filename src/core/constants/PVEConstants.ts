export abstract class PVEConstants {
	static readonly TIME_BETWEEN_SMALL_EVENTS = 60 * 1000; // 1 minute

	static TRAVEL_COST = [0, 25, 75];

	static COLLECTOR_TIME: 30000;

	static FIGHT_POINTS_SMALL_EVENT = {
		MIN_PERCENT: 0.02,
		MAX_PERCENT: 0.07
	};

	static MIN_LEVEL = 20;

	/**
	 * The formula is
	 * f(x) = ax² + bx + c
	 * with x the monster lvl
	 */
	static STATS_FORMULA = {
		ATTACK: {
			A: 0.02825,
			B: 0.94359,
			C: 25.56363
		},
		DEFENSE: {
			A: 0.03576,
			B: 0.55352,
			C: 21.67272
		},
		SPEED: {
			A: 0.01359,
			B: 0.21588,
			C: 9.44242
		},
		ENERGY: {
			A: 0.06211,
			B: 11.18950,
			C: 30.30303
		}
	};
}