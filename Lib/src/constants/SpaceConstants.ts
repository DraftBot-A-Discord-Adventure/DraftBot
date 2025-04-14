export abstract class SpaceConstants {
	static readonly INVENTED_ASTEROIDS_NAMES = [
		"Draftstéroïde",
		"Hamseroïde",
		"Starlink",
		"Hamseroïde",
		"Mindustroide",
		"Thermaride",
		"Gangstéroïde",
		"Gédézémauroïde",
		"81-PUP-377",
		"666-42-69-16.5",
		"Banaeroid",
		"Rollercosteroïde",
		"R2D2ledroïde",
		"Gros Caillou",
		"Astranarion",
		"Marsienroïde",
		"Gédézémauroïde",
		"Caillou",
		"Gros Caillou",
		"QQ-47-3NU7",
		"@setéroïde",
		"Chulxubub"
	];

	static readonly DISTANCE_RANGE = {
		MIN: 1,
		MAX: 100
	};

	static readonly DIAMETER_RANGE = {
		MIN: 1,
		MAX: 1000
	};

	static readonly WAIT_TIME_BEFORE_SEARCH = 5000;

	static readonly PARTIAL_LUNAR_ECLIPSE = "partial";

	static readonly TOTAL_LUNAR_ECLIPSE = "total";

	static readonly FUNCTIONS = {
		neoWS: "neoWS",
		moonPhase: "moonPhase",
		nextFullMoon: "nextFullMoon",
		nextPartialLunarEclipse: "nextPartialLunarEclipse",
		nextTotalLunarEclipse: "nextTotalLunarEclipse"
	};
}
