export abstract class FightConstants {
	static readonly RARE_SUB_TEXT_INTRO = 0.001; // Chance of having a rare subtext in the fight intro message (1=100%)

	static readonly MAX_TURNS = 24;

	static readonly REQUIRED_LEVEL = 8;

	static readonly POINTS_REGEN_MINUTES = 7;

	static readonly POINTS_REGEN_AMOUNT = 110;


	static readonly REWARDS = {
		NUMBER_OF_WIN_THAT_AWARD_SCORE_BONUS: 3,
		SCORE_BONUS_AWARD: 35,
		WIN_MONEY_BONUS: 50,
		DRAW_MONEY_BONUS: 30,
		LOSS_MONEY_BONUS: 15,
		MAX_MONEY_BONUS: 200
	};

	// Duration of the menu that searches for an opponent in milliseconds


	// Number of reactions the bot will accept before closing a fight request due to spam.


	// Amount of time a user has to react during a fight


	// Random variation of the damage a fight action will deal (between -this value and +this value)
	static readonly DAMAGE_RANDOM_VARIATION = 5;

	// Depending on its level, a player has a malus or bonus on the damage he deals
	static readonly PLAYER_LEVEL_MINIMAL_MALUS = -55;

	// Depending on its level, a player has a malus or bonus on the damage he deals
	static readonly PLAYER_LEVEL_MAXIMAL_BONUS = 55;

	// Above this level a player has a cap on the bonus he gets from the level (the bonus is capped to the above value)
	static readonly MAX_PLAYER_LEVEL_FOR_BONUSES = 75;

	// Multiplier of the damage a fight action will deal if it is a critical hit
	static readonly CRITICAL_HIT_MULTIPLIER = 1.5;

	// Out-of-breath attack failure probability
	static readonly OUT_OF_BREATH_FAILURE_PROBABILITY = 0.8;

	// Divider of the damage a fight action will deal if it is a miss
	static readonly FAILURE_DIVIDERS = [
		0.25,
		0.2,
		0.125,
		0.1,
		0
	];

	// To avoid issues with discord 2000-character limit
	static readonly MAX_HISTORY_LENGTH = 1950;

	// Targets types


	// Kind of useless, but I don't care
	static OPERATOR = {
		PLUS: "+",
		MINUS: "-"
	};

	static readonly FIGHT_ACTIONS =
		{
			PLAYER: {
				SIMPLE_ATTACK: "simpleAttack",
				POWERFUL_ATTACK: "powerfulAttack",
				QUICK_ATTACK: "quickAttack",
				HEAVY_ATTACK: "heavyAttack",
				INTENSE_ATTACK: "intenseAttack",
				ENERGETIC_ATTACK: "energeticAttack",
				PIERCING_ATTACK: "piercingAttack",
				CANON_ATTACK: "canonAttack",
				RAM_ATTACK: "ramAttack",
				CHARGING_ATTACK: "chargingAttack",
				SHIELD_ATTACK: "shieldAttack",
				SABOTAGE_ATTACK: "sabotageAttack",
				BOOMERANG_ATTACK: "boomerangAttack",
				ULTIMATE_ATTACK: "ultimateAttack",
				DIVINE_ATTACK: "divineAttack",
				POISONOUS_ATTACK: "poisonousAttack",
				FIRE_ATTACK: "fireAttack",
				BREATH_TAKING_ATTACK: "breathTakingAttack",
				DARK_ATTACK: "darkAttack",
				CURSED_ATTACK: "cursedAttack",
				RAGE_EXPLOSION: "rageExplosion",
				GUILD_ATTACK: "guildAttack",
				CHARGE_CHARGING_ATTACK: "chargeChargingAttack",
				CHARGE_ULTIMATE_ATTACK: "chargeUltimateAttack",
				COUNTER_ATTACK: "counterAttack",
				PROTECTION: "protection",
				DEFENSE_BUFF: "defenseBuff",
				BENEDICTION: "benediction",
				CONCENTRATION: "concentration",
				RESTING: "resting",
				NONE: "none",
				GET_DIRTY: "getDirty"
			},
			MONSTER: {
				CLUB_SMASH_ATTACK: "clubSmashAttack",
				CHARGE_CLUB_SMASH_ATTACK: "chargeClubSmashAttack",
				BOULDER_TOSS_ATTACK: "boulderTossAttack",
				SLAM_ATTACK: "slamAttack",
				GRAB_AND_THROW_ATTACK: "grabAndThrowAttack",
				MAGIC_MIMIC_ATTACK: "magicMimicAttack",
				FAMILY_MEAL_ATTACK: "familyMealAttack",
				WEB_SHOT_ATTACK: "webShotAttack",
				ERUPTION_ATTACK: "eruptionAttack",
				HEAT_DRAIN_ATTACK: "heatDrainAttack",
				LAVA_WAVE_ATTACK: "lavaWaveAttack",
				MAGMA_BATH_ATTACK: "magmaBathAttack",
				OUTRAGE_ATTACK: "outrageAttack",
				ROAR_ATTACK: "roarAttack",
				SUMMON_ATTACK: "summonAttack",
				STEALTH: "stealth",
				PETRIFICATION_ATTACK: "petrificationAttack",
				ROCK_SHIELD_ATTACK: "rockShieldAttack",
				STONE_SKIN_ATTACK: "stoneSkinAttack",
				MUD_SHOT_ATTACK: "mudShotAttack",
				HEAT_MUD_ATTACK: "heatMudAttack"
			},
			ALTERATION: {
				BLIND: "blind",
				BURNED: "burned",
				CONCENTRATED: "concentrated",
				CONFUSED: "confused",
				CURSED: "cursed",
				DIRTY: "dirty",
				FROZEN: "frozen",
				FULL: "full",
				OUTRAGE: "outrage",
				OUT_OF_BREATH: "outOfBreath",
				PARALYZED: "paralyzed",
				PETRIFIED: "petrified",
				POISONED: "poisoned",
				PROTECTED: "protected",
				SLOWED: "slowed",
				STUNNED: "stunned",
				SWALLOWED: "swallowed",
				TARGETED: "targeted",
				WEAK: "weak"
			},
			PET: {
				BITE: "bite",
				BOOST_DEFENSE: "boostDefense",
				BOOST_SPEED: "boostSpeed",
				CLAWS: "claws",
				CREATE_BOMB: "createBomb",
				BUILD_BARRAGE: "buildBarrage",
				ELEPHANT_REMEMBER_LAST_ACTION: "elephantRememberLastAction",
				FISH_PROTECT_AGAINST_FIRE: "fishProtectAgainstFire",
				GOES_WILD: "goesWild",
				HEAL_EVERYONE: "healEveryone",
				HELP_BREATHE: "helpBreathe",
				HORN: "horn",
				HYPNOSIS: "hypnosis",
				IS_USELESS: "isUseless",
				MEDUSE_PARALYZE: "meduseParalyze",
				PECK: "peck",
				PET_CHARGE: "petCharge",
				PET_CURSE: "petCurse",
				PET_HIT: "petHit",
				PET_POISON: "petPoison",
				PET_SMALL_CHARGE: "petSmallCharge",
				PINCH: "pinch",
				POISONOUS_BITE: "poisonousBite",
				PROTECT_AGAINST_COLD: "protectAgainstCold",
				RAINBOW_POWER: "rainbowPower",
				REVENGE: "revenge",
				SCARE_ELEPHANT: "scareElephant",
				SCARE_FISH: "scareFish",
				SLIPPING: "slipping",
				SMALL_CLAWS: "smallClaws",
				SMALL_REGEN: "smallRegen",
				SNOW_BALL: "snowBall",
				SPIT: "spit",
				SPIT_FIRE: "spitFire",
				SPIT_INK: "spitInk",
				STEAL_WEAPON: "stealWeapon",
				SWALLOW: "swallow",
				TRIES_TO_HELP: "triesToHelp",
				UN_BLIND: "unBlind",
				VAMPIRISM: "vampirism"
			}
		};

	static readonly UNCOUNTERABLE_ACTIONS = [
		FightConstants.FIGHT_ACTIONS.PLAYER.ULTIMATE_ATTACK,
		FightConstants.FIGHT_ACTIONS.PLAYER.BENEDICTION,
		FightConstants.FIGHT_ACTIONS.PLAYER.DIVINE_ATTACK,
		FightConstants.FIGHT_ACTIONS.PLAYER.NONE,
		FightConstants.FIGHT_ACTIONS.PLAYER.POISONOUS_ATTACK,
		FightConstants.FIGHT_ACTIONS.PLAYER.CONCENTRATION,
		FightConstants.FIGHT_ACTIONS.PLAYER.RESTING,
		FightConstants.FIGHT_ACTIONS.PLAYER.PROTECTION,
		FightConstants.FIGHT_ACTIONS.PLAYER.COUNTER_ATTACK,
		FightConstants.FIGHT_ACTIONS.PLAYER.DEFENSE_BUFF,
		FightConstants.FIGHT_ACTIONS.PLAYER.FIRE_ATTACK,
		FightConstants.FIGHT_ACTIONS.PLAYER.BREATH_TAKING_ATTACK,
		FightConstants.FIGHT_ACTIONS.PLAYER.DARK_ATTACK,
		FightConstants.FIGHT_ACTIONS.PLAYER.CURSED_ATTACK,
		FightConstants.FIGHT_ACTIONS.ALTERATION.OUT_OF_BREATH,
		FightConstants.FIGHT_ACTIONS.MONSTER.OUTRAGE_ATTACK,
		FightConstants.FIGHT_ACTIONS.MONSTER.ROAR_ATTACK,
		FightConstants.FIGHT_ACTIONS.MONSTER.SUMMON_ATTACK,
		FightConstants.FIGHT_ACTIONS.MONSTER.STEALTH,
		FightConstants.FIGHT_ACTIONS.MONSTER.ERUPTION_ATTACK,
		FightConstants.FIGHT_ACTIONS.MONSTER.MAGMA_BATH_ATTACK,
		FightConstants.FIGHT_ACTIONS.MONSTER.LAVA_WAVE_ATTACK,
		FightConstants.FIGHT_ACTIONS.MONSTER.MUD_SHOT_ATTACK,
		FightConstants.FIGHT_ACTIONS.MONSTER.HEAT_MUD_ATTACK,
		FightConstants.FIGHT_ACTIONS.MONSTER.HEAT_DRAIN_ATTACK
	];

	static readonly GOD_MOVES = [
		FightConstants.FIGHT_ACTIONS.PLAYER.BENEDICTION,
		FightConstants.FIGHT_ACTIONS.PLAYER.DIVINE_ATTACK
	];

	static readonly ELO = {
		DEFAULT_ELO: 150,
		MAX_ELO_GAP: 400,
		DEFAULT_K_FACTOR: 32,
		LOW_K_FACTOR: 24,
		VERY_LOW_K_FACTOR: 16,
		LOW_K_FACTOR_THRESHOLD: 2100,
		VERY_LOW_K_FACTOR_THRESHOLD: 2400,
		LOW_LEVEL_BONUS_THRESHOLD: 1000,
		MAX_RANK_FOR_LEAGUE_POINTS_REWARD: 200,
		ELO_DIFFERENCE_FOR_SAME_ELO: 30
	};

	// If a player has a fight countdown higher than this value, he will not appear in the glory top
	static readonly FIGHT_COUNTDOWN_MAXIMAL_VALUE = 0;

	// A player will not earn more fightCountdown than this value
	static readonly FIGHT_COUNTDOWN_REGEN_LIMIT = 7;

	// FightCountdown value for new players
	static readonly DEFAULT_FIGHT_COUNTDOWN = 10;

	// Added at the end of the fight to the last message


	// Time needed to wait before being able to fight again after a ranked fight as a defender
	static DEFENDER_COOLDOWN_MINUTES = 30;

	// Maximum offset for opponent search
	static MAX_OFFSET_FOR_OPPONENT_SEARCH = 5;

	// Number of players to search for when looking for an opponent
	static PLAYER_PER_OPPONENT_SEARCH = 5;

	// Amount of attack glory transformed into defense glory each week
	static ATTACK_GLORY_TO_DEFENSE_GLORY_EACH_WEEK = 50;
}
