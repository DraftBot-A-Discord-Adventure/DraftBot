export abstract class LeagueInfoConstants {
	static readonly FIELDS_VALUE = "{emoji} {name}";

	static readonly MONEY_TO_AWARD = [
		250, // Wood
		300, // Rock
		500, // Iron
		600, // Bronze
		800, // Silver
		1000, // Gold
		1250, // Diamond
		1400, // Elite
		1500, // Infinite
		2000 // Legendary
	];

	static readonly XP_TO_AWARD = [
		200, // Wood
		350, // Rock
		500, // Iron
		650, // Bronze
		750, // Silver
		1000, // Gold
		1300, // Diamond
		1350, // Elite
		1750, // Infinite
		2000 // Legendary
	];

	static readonly ITEM_MINIMAL_RARITY = [
		2, // Wood
		2, // Rock
		3, // Iron
		3, // Bronze
		3, // Silver
		4, // Gold
		4, // Diamond
		4, // Elite
		5, // Infinite
		5 // Legendary
	];

	static readonly ITEM_MAXIMAL_RARITY = [
		3, // Wood
		4, // Rock
		4, // Iron
		5, // Bronze
		6, // Silver
		6, // Gold
		7, // Diamond
		8, // Elite
		8, // Infinite
		8 // Legendary
	];

	// If the minimal glory of a league is higher than this value, the player will lose glory points at the end of the season
	static readonly GLORY_RESET_THRESHOLD = 500;

	// % of glory points lost at the end of the season (only points above the glory reset threshold are considered)
	static readonly SEASON_END_LOSS_PERCENTAGE = 0.04;
}
