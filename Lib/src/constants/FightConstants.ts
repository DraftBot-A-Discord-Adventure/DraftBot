export abstract class FightConstants {
	static readonly RARE_SUB_TEXT_INTRO = 0.001; // Chance of having a rare subtext in the fight intro message (1=100%)

	static readonly MAX_TURNS = 24;

	static readonly REQUIRED_LEVEL = 8;

	static readonly POINTS_REGEN_MINUTES = 15;

	static readonly POINTS_REGEN_AMOUNT = 50;

	static readonly FIGHT_ERROR = {
		NONE: "none",
		BABY: "error.baby",
		WRONG_LEVEL: "error.levelTooLow",
		DEAD: "error.dead",
		DISALLOWED_EFFECT: "error.cantFightStatus",
		OCCUPIED: "error.occupied",
		NO_ENERGY: "error.noEnergy",
		ELO_GAP: "error.eloGap",
		PVE_ISLAND: "error.onPveIsland"
	};

	// Duration of the menu that search for an opponent in milliseconds
	static readonly ASKING_MENU_DURATION = 120000;

	// Number of reaction the bot will accept before closing a fight request due to spam.
	static readonly SPAM_PROTECTION_MAX_REACTION_AMOUNT = 2;

	// Amount of time a user has to react during a fight
	static readonly TIME_FOR_ACTION_SELECTION = 45000;

	// Random variation of the damage a fight action will deal (between -this value and +this value)
	static readonly DAMAGE_RANDOM_VARIATION = 5;

	// Depending on its level a player has a malus or bonus on the damage he deals
	static readonly PLAYER_LEVEL_MINIMAL_MALUS = -55;

	// Depending on its level a player has a malus or bonus on the damage he deals
	static readonly PLAYER_LEVEL_MAXIMAL_BONUS = 55;

	// Above this level a player has a cap on the bonus he gets from the level (the bonus is capped to the above value)
	static readonly MAX_PLAYER_LEVEL_FOR_BONUSES = 75;

	// Multiplier of the damage a fight action will deal if it is a critical hit
	static readonly CRITICAL_HIT_MULTIPLIER = 1.5;

	// Out of breath attack failure probability
	static readonly OUT_OF_BREATH_FAILURE_PROBABILITY = 0.8;

	// Divider of the damage a fight action will deal if it is a miss
	static readonly FAILURE_DIVIDERS = [0.25, 0.2, 0.125, 0.1, 0];

	// To avoid issues with discord 2000 characters limit
	static readonly MAX_HISTORY_LENGTH = 1950;

	// Targets types
	static readonly TARGET = {
		SELF: 0,
		OPPONENT: 1
	};

	// Kind of useless, but I don't care
	static OPERATOR = {
		PLUS: "+",
		MINUS: "-"
	};

	static readonly UNCOUNTERABLE_ACTIONS = [
		"ultimateAttack",
		"benediction",
		"divineAttack",
		"none",
		"poisonousAttack",
		"concentration",
		"resting",
		"protection",
		"counterAttack",
		"defenseBuff",
		"fireAttack",
		"breathTakingAttack",
		"darkAttack",
		"cursedAttack",
		"outOfBreath",
		"outrageAttack",
		"roarAttack",
		"summonAttack",
		"stealth"
	];

	static readonly GOD_MOVES = [
		"benediction",
		"divineAttack"
	];

	static readonly ELO = {
		DEFAULT_ELO: 0,
		MAX_ELO_GAP: 400,
		DEFAULT_K_FACTOR: 32,
		LOW_K_FACTOR: 24,
		VERY_LOW_K_FACTOR: 16,
		LOW_K_FACTOR_THRESHOLD: 2100,
		VERY_LOW_K_FACTOR_THRESHOLD: 2400,
		LOW_LEVEL_BONUS_THRESHOLD: 1000,
		LEAGUE_POINTS_REWARDS_COEFFICIENT_1: 0.4446,
		LEAGUE_POINTS_REWARDS_COEFFICIENT_2: 12.8819,
		LEAGUE_POINTS_REWARD_BASE_VALUE: 3994,
		MAX_RANK_FOR_LEAGUE_POINTS_REWARD: 200
	};

	// If a player has a fight countdown higher than this value, he will not appear in the glory top
	static readonly FIGHT_COUNTDOWN_MAXIMAL_VALUE = 0;

	// A player will not earn more fightCountdown than this value
	static readonly FIGHT_COUNTDOWN_REGEN_LIMIT = 7;

	// FightCountdown value for new players
	static readonly DEFAULT_FIGHT_COUNTDOWN = 10;

	// Added at the end of the fight to the last message
	static readonly HANDSHAKE_EMOTE = "\uD83E\uDD1D";

	static readonly DEFAULT_ACTION_WEIGHT = 1;

	// Time needed to wait before being able to fight again after a ranked fight as a defender
	static DEFENDER_COOLDOWN_MINUTES = 30;

	// Maximum offset for opponent search
	static MAX_OFFSET_FOR_OPPONENT_SEARCH = 5;

	// Number of players to search for when looking for an opponent
	static PLAYER_PER_OPPONENT_SEARCH = 5;
}