export abstract class PetConstants {
	static readonly IS_FOOD = 1;

	static readonly NICKNAME_LENGTH_RANGE = {
		MIN: 3,
		MAX: 16
	};

	static readonly SEX = {
		MALE: "m",
		FEMALE: "f"
	};

	static readonly BREED_COOLDOWN = 60 * 60 * 1000; // 1 hour

	static readonly MAX_LOVE_POINTS = 100;

	static readonly BASE_LOVE = 10;

	static readonly GUILD_LEVEL_USED_FOR_NO_GUILD_LOOT = 20;

	static readonly LOVE_LEVELS = [5, 20, 50];

	static readonly LOVE_LEVEL = {
		FEISTY: 1,
		WILD: 2,
		FEARFUL: 3,
		TAMED: 4,
		TRAINED: 5
	};

	static readonly SELL_PRICE = {
		MIN: 100,
		MAX: 50000
	};
}