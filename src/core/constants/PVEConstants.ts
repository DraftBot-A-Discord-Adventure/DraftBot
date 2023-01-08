export abstract class PVEConstants {
	static readonly TIME_BETWEEN_SMALL_EVENTS = 60 * 1000; // 1 minute

	static TRAVEL_COST = [0, 25, 75];

	static COLLECTOR_TIME: 30000;

	static FIGHT_POINTS_SMALL_EVENT = {
		MIN_PERCENT: 0.02,
		MAX_PERCENT: 0.07
	};

	static MIN_LEVEL = 20;
}