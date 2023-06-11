export abstract class PVEConstants {
	static readonly TIME_BETWEEN_SMALL_EVENTS = 60 * 1000; // 1 minute

	static TRAVEL_COST = [0, 25, 75];

	static COLLECTOR_TIME: 30000;

	static FIGHT_POINTS_SMALL_EVENT = {
		MIN_PERCENT: 0.02,
		MAX_PERCENT: 0.07
	};

	static MIN_LEVEL = 20;

	static MONSTER_LEVEL_RANDOM_RANGE = 10;

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

	static BLOCKED_COMMANDS = [
		"dailybonus",
		"drink",
		"fight",
		"leaguebonus",
		"sell",
		"shop",
		"missionsshop",
		"guildbonus",
		"guildshop"
	];

	/**
	 * The formula is
	 * f(x) = ax² + bx + c
	 * with x the total monster stats for xp and money
	 *
	 * The formula is
	 * f(x) = ax + b
	 * for the level multiplier
	 */
	static FIGHT_REWARDS = {
		TOTAL_RATIO_RANDOM_RANGE: 0.1,
		GUILD_SCORE_MULTIPLIER: 10,
		XP: {
			A: 0.1529,
			B: 0.9686,
			C: 106.4
		},
		MONEY: {
			A: 0.1207,
			B: 0.8671,
			C: 84
		},
		LEVEL_MULTIPLIER: {
			A: 0.0125,
			B: 0.75
		}
	};

	static OUT_OF_BREATH_CHOOSE_PROBABILITY = 0.1;

	static GUILD_ATTACK_PROBABILITY = 0.25;
}