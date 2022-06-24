export abstract class FightConstants {
	static readonly MAX_SPEED_IMPROVEMENT = 30;

	static readonly MAX_TURNS = 25;

	static readonly REQUIRED_LEVEL = 8;

	static readonly POINTS_REGEN_MINUTES = 15;

	static readonly POINTS_REGEN_AMOUNT = 50;

	static readonly FIGHT_ERROR = {
		NONE: "none",
		WRONG_LEVEL: "error.levelTooLow",
		DISALLOWED_EFFECT: "error.cantFightStatus",
		OCCUPIED: "error.occupied",
		NO_FIGHT_POINTS: "error.noFightPoints"
	};

	// duration of the menu that search for an opponent in miliseconds
	static readonly ASKING_MENU_DURATION = 120000;

	// number of reaction the bot will accept before closing a fight request due to spam.
	static readonly SPAM_PROTECTION_MAX_REACTION_AMOUNT = 2;

	// amount of time a user has to react during a fight
	static readonly TIME_FOR_ACTION_SELECTION = 45000;

	// random variation of the damage a fight action will deal (between -this value and +this value)
	static readonly DAMAGE_RANDOM_VARIATION = 5;

	// depending on its level a player has a malus or bonus on the damage he deals
	static readonly PLAYER_LEVEL_MINIMAL_MALUS = -20;

	// depending on its level a player has a malus or bonus on the damage he deals
	static readonly PLAYER_LEVEL_MAXIMAL_BONUS = 20;

	// above this level a player has a cap on the bonus he gets from the level (the bonus is capped to the above value)
	static readonly MAX_PLAYER_LEVEL_FOR_BONUSES = 75;
}