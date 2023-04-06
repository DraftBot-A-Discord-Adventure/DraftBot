export abstract class LeagueInfoConstants {
	static readonly FIELDS_VALUE = "{emoji} {name}";

	static readonly MONEY_TO_AWARD = [
		250, // wood
		300, // rock
		500, // iron
		600, // bronze
		800, // silver
		1000, // gold
		1250, // diamond
		1400, // elite
		1500, // infinite
		2000 // legendary
	];

	static readonly XP_TO_AWARD = [
		200, // wood
		350, // rock
		500, // iron
		650, // bronze
		750, // silver
		1000, // gold
		1300, // diamond
		1350, // elite
		1750, // infinite
		2000 // legendary
	];

	static readonly ITEM_MINIMAL_RARITY = [
		2, // wood
		2, // rock
		3, // iron
		3, // bronze
		3, // silver
		4, // gold
		4, // diamond
		4, // elite
		5, // infinite
		5 // legendary
	];

	static readonly ITEM_MAXIMAL_RARITY = [
		3, // wood
		4, // rock
		4, // iron
		5, // bronze
		6, // silver
		6, // gold
		7, // diamond
		8, // elite
		8, // infinite
		8 // legendary
	];

	// if the minimal glory of a league is higher than this value, the player will lose glory points at the end of the season
	static readonly GLORY_RESET_THRESHOLD = 500;

	// % of glory points lost at the end of the season (only points above the glory reset threshold are considered)
	static readonly SEASON_END_LOSS_PERCENTAGE = 0.3;
}