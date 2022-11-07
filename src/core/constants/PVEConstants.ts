export abstract class PVEConstants {
	static readonly MAPS = {
		ENTRY_LINK: 93,
		EXIT_MAP: 38,
		PVE_LINK_RANGES: [[85, 94]],
		BOAT_LINK: 94,
		CONTINENT_MAP: 39,
		ENTRY_MAP: 33
	};

	static readonly TIME_BETWEEN_SMALL_EVENTS = 60 * 1000; // 1 minute

	static TRAVEL_COST = [0, 25, 75];

	static COLLECTOR_TIME: 30000;

	static FIGHT_POINTS_SMALL_EVENT = {
		MIN_PERCENT: 0.02,
		MAX_PERCENT: 0.07
	};

	static MIN_LEVEL = 20;
}