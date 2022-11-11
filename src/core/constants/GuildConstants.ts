export abstract class GuildConstants {
	static readonly ICON: "https://i.imgur.com/sQHBly4.png";

	static readonly DEFAULT_VALUES = {
		SCORE: 0,
		LEVEL: 0,
		EXPERIENCE: 0,
		COMMON_FOOD: 0,
		HERBIVOROUS_FOOD: 0,
		CARNIVOROUS_FOOD: 0,
		ULTIMATE_FOOD: 0
	};

	static readonly XP_CALCULATION_STEP = 5000;

	static readonly MIN_XP_DIVIDER = 20;

	static readonly MAX_XP_DIVIDER = 20 / 9;
}