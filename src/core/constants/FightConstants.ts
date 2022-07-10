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
	static readonly PLAYER_LEVEL_MINIMAL_MALUS = 0;

	// depending on its level a player has a malus or bonus on the damage he deals
	static readonly PLAYER_LEVEL_MAXIMAL_BONUS = 55;

	// above this level a player has a cap on the bonus he gets from the level (the bonus is capped to the above value)
	static readonly MAX_PLAYER_LEVEL_FOR_BONUSES = 75;

	// multiplier of the damage a fight action will deal if it is a critical hit
	static readonly CRITICAL_HIT_MULTIPLIER = 1.5;

	// divider of the damage a fight action will deal if it is a miss
	static readonly FAILURE_DIVIDERS = [0.25, 0.2, 0.125, 0.1, 0];

	// attack status
	static readonly ATTACK_STATUS = {
		CRITICAL: "critical",
		NORMAL: "normal",
		MISSED: "missed"
	};

	// Targets types
	static readonly TARGET = {
		SELF: 0,
		OPPONENT: 1
	}

	// kind of useless, but I don't care
	static OPERATOR = {
		PLUS: "+",
		MINUS: "-"
	};

	// amount of fight points a player will lose when he is poisoned
	static POISON_DAMAGE_PER_TURN = 30;

	// % of chance a player will heal himself when he is poisoned
	static POISON_END_PROBABILITY = 25;

	// empty string to register cancellation of an alteration display
	static CANCEL_ALTERATION_DISPLAY = "";

	// file name of the fight actions interfaces for the fight alterations the player can have
	static ALTERATION_FIGHT_ACTION: string[] = [
		"alterations/normal",
		"alterations/slowed",
		"alterations/poisoned",
		"alterations/stunned",
		"alterations/concentrated",
		"alterations/weak",
		"alterations/confused",
		"alterations/protected"
	];

	static ACTION_ID = {
		RESTING: "resting",
		NO_MOVE: "none",
		DIVINE_ATTACK: "divineAttack",
		BENEDICTION: "benediction"
	}

}