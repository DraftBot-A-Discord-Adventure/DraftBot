import { TimeConstants } from "./TimeConstants";

export abstract class PVEConstants {
	static readonly TIME_AFTER_INACTIVITY_ON_BOAT_IS_NOT_ACCEPTED = 24 * 3 * 3600 * 1000; // 3 days;

	static readonly TIME_BETWEEN_SMALL_EVENTS = 18 * 1000; // 18 seconds

	static readonly TRAVEL_COST = [
		0,
		15,
		25
	];

	static readonly COLLECTOR_TIME = 30000;

	static readonly FIGHT_POINTS_SMALL_EVENT = {
		MIN_PERCENT: 0.02,
		MAX_PERCENT: 0.07
	};

	static readonly MIN_LEVEL = 20;

	static readonly MIN_MONSTER_LEVEL = 1;

	static readonly NON_FINAL_BOSS_MONSTER_LEVEL_RANDOM_OFFSET = {
		MIN: -20,
		MAX: 5
	} as const;

	static readonly NON_FINAL_BOSS_MONSTER_LEVEL_ABOVE_RECORD_PROBABILITY = 0.12;

	static readonly FINAL_BOSS_MONSTER_LEVEL_RANDOM_OFFSET = {
		MIN: -10,
		MAX: 5
	} as const;

	static readonly FINAL_BOSS_MONSTER_LEVEL_ABOVE_RECORD_PROBABILITY = 0.18;

	/**
	 * The formula is
	 * f(x) = ax² + bx + c
	 * with x the monster lvl
	 */
	static readonly STATS_FORMULA = {
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
		}
	};

	// Allow commands is better than disallowed commands because if there is a new command it will not be allowed by default


	static readonly FIGHT_REWARDS = {
		RANDOM_MAX_REWARD: 100,
		MONEY_FACTOR: 3.8,
		XP_FACTOR: 6.8,
		GUILD_SCORE_FACTOR: 2.8,
		GUILD_XP_FACTOR: 4.7
	};

	static readonly OUT_OF_BREATH_CHOOSE_PROBABILITY = 0.1;

	static readonly GUILD_ATTACK_PROBABILITY = 0.25;

	static readonly MINIMAL_ENERGY_RATIO = 0.8;

	static readonly RAGE_MIN_MULTIPLIER = 1;

	static readonly TIME_CHECKED_FOR_PLAYERS_THAT_WERE_ON_THE_ISLAND = TimeConstants.MS_TIME.HOUR;

	static readonly RAGE_MAX_DAMAGE = 250;

	static readonly DAMAGE_INCREASED_DURATION = 7;

	static readonly MONEY_MALUS_MULTIPLIER_FOR_GUILD_PLAYERS = 1;

	static readonly MONEY_MALUS_MULTIPLIER_FOR_SOLO_PLAYERS = 2;

	static readonly MONEY_LOST_PER_LEVEL_ON_DEATH = 3.4;

	static readonly GUILD_POINTS_LOST_ON_DEATH = 150;

	static readonly RANDOM_RANGE_FOR_GUILD_POINTS_LOST_ON_DEATH = 20;

	static readonly BOSS_LOOT = {
		MIN_DROPS: 8,
		MAX_DROPS: 18
	};

	/**
	 * Loot tables for each PVE boss map location.
	 * Each entry maps a map ID to an array of material IDs that can drop.
	 */
	static readonly BOSS_LOOT_TABLES: Record<number, readonly number[]> = {
		// Island 1 - Tropical
		1001: [
			58,
			51,
			59,
			55,
			2,
			66,
			40,
			31,
			18
		], // Forest (Forest Troll, Slimy Mutant): wood + nature + mushrooms
		1002: [
			14,
			7,
			20,
			24,
			13,
			29,
			81,
			16,
			83
		], // Ruins (Skeleton): old metal + alloy + cloth + leather gear
		1003: [
			70,
			21,
			1,
			44,
			90,
			23,
			4,
			75
		], // Mine (Spider): ore + explosive + spider silk
		1004: [
			70,
			24,
			54,
			90,
			41,
			67,
			86,
			5
		], // Mountain (Rock Golem): ore + gems + mountain plants
		1005: [
			82,
			35,
			21,
			23,
			44,
			86,
			62,
			56
		], // Volcano (Magma Titan, final): fire + explosive + volcanic metal
		// Island 2 - Ice
		1101: [
			54,
			48,
			42,
			29,
			26,
			11
		], // Tundra (White Wolf): prey hides + moss
		1102: [
			77,
			34,
			33,
			53,
			80,
			5,
			69,
			67
		], // Crystal Cavern (Shiny Elementary): crystals + magic
		1103: [
			89,
			73,
			68,
			60,
			30,
			80,
			72,
			61,
			19
		], // Blessed Doors (Celestial Guardian): spiritual + celestial
		1104: [
			70,
			24,
			77,
			90,
			53,
			76,
			4,
			87
		], // Ice Peak (Ice Lord): dragon scale + mountain ore + rare flower
		1105: [
			55,
			54,
			68,
			78,
			66,
			27,
			36,
			40
		], // Underground Lake (Crocodile): crocodile hide + reptile skin + mushrooms
		1106: [
			20,
			7,
			43,
			9,
			88,
			75,
			18
		], // Devastated Village (Yuki-Onna): wood + silk + old alloy
		1107: [
			77,
			34,
			68,
			53,
			80,
			78,
			76,
			69,
			67
		], // Ice Nest (Ice Queen, final): dragon scale + magic + dragon hoard

		// Island 3 - Oceanic
		1201: [
			68,
			54,
			8,
			78,
			67,
			84
		], // Lagoon Hollow (Turtle): water + algae + reptile skin + pearls + driftwood
		1202: [
			68,
			77,
			34,
			33,
			53,
			5,
			69
		], // Maritime Cavern (Water Spirit): water magic + crystals
		1203: [
			21,
			14,
			25,
			43,
			44,
			81,
			47,
			35,
			56,
			12
		], // Revenant's Cove (Captain Crow): gunpowder + metal + ship ropes + treasure + will-o'-the-wisps
		1204: [
			68,
			77,
			34,
			53,
			78,
			33,
			67,
			75
		], // Whispering Cave (Mermaid): spiritual + magic + scales + pearls + silk
		1205: [
			20,
			14,
			47,
			49,
			78,
			38,
			28,
			57,
			67
		], // Depths Chasm (Kraken): shipwreck ropes + tentacle skin + toxins + abyssal oil
		1206: [
			34,
			68,
			77,
			33,
			53,
			76,
			87,
			3
		] // Abyssal Ravine (Leviathan): primordial magic + scales + abyssal life
	};
}
