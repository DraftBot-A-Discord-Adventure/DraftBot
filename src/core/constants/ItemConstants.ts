export abstract class ItemConstants {
	static readonly SLOTS = {
		LIMITS: [
			2,
			2,
			4,
			4
		],
		PRICES: [
			500,
			1000,
			2500,
			7000,
			12000,
			17000,
			25000,
			30000
		]
	};

	static readonly NATURE = {
		NONE: 0,
		HEALTH: 1,
		SPEED: 2,
		ATTACK: 3,
		DEFENSE: 4,
		HOSPITAL: 5,
		MONEY: 6,
		ENERGY: 7
	};

	static readonly RARITY = {
		BASIC: 0,
		COMMON: 1,
		UNCOMMON: 2,
		EXOTIC: 3,
		RARE: 4,
		SPECIAL: 5,
		EPIC: 6,
		LEGENDARY: 7,
		MYTHICAL: 8,

		VALUES: [
			0, // basic
			20, // common
			40, // uncommon
			100, // exotic
			250, // rare
			580, // special
			1690, // epic
			5000, // legendary
			10000 // mythic
		],

		GENERATOR: {
			VALUES: [ // common
				4375, // uncommon
				6875, // exotic
				8375, // rare
				9375, // special
				9875, // epic
				9975, // legendary
				9998, // mythic
				10000
			],
			MAX_VALUE: 10000 // be sure this number is the same as the last value in the VALUES array
		}
	};

	static readonly CATEGORIES = {
		WEAPON: 0,
		ARMOR: 1,
		POTION: 2,
		OBJECT: 3
	};
}