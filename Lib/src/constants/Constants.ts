export class Constants {

	static readonly MESSAGES = {
		COLLECTOR_TIME: 120000,
		PROGRESS_BAR_SIZE: 20,
		MAX_SPAM_COUNT: 3,
		DEFAULT_REACTION_LIMIT: 1
	};

	static readonly XP = {
		BASE_VALUE: 325,
		COEFFICIENT: 1.041,
		MINUS: 188
	};

	static readonly ITEM_NATURE = {
		NO_EFFECT: 0,
		HEALTH: 1,
		SPEED: 2,
		ATTACK: 3,
		DEFENSE: 4,
		TIME_SPEEDUP: 5,
		MONEY: 6
	};

	static readonly REPORT = {
		HOURS_USED_TO_CALCULATE_FIRST_REPORT_REWARD: 1, // Used to get the amount of point a user will get in the first report, 1 hour = 60 points ( + some bonus )
		TIME_BETWEEN_BIG_EVENTS: 2 * 60 * 60 * 1000, // 2 hours
		BONUS_POINT_TIME_DIVIDER: 6,
		POINTS_BY_SMALL_EVENT: 50,
		PATH_SQUARE_COUNT: 16,
		TIME_BETWEEN_MINI_EVENTS: 9.75 * 60 * 1000, // 9 minutes and 45 seconds
		AUTO_CHOOSE_DESTINATION_CHANCE: 0.15 // 15%
	};

	// This constant represent the different types of values on which the players can be ranked
	static readonly RANK_TYPES = {
		LEVEL: "level",
		SCORE: "score",
		WEEKLY_SCORE: "weeklyScore",
		LAST_SEASON_GLORY: "gloryPointsLastSeason",
		GLORY: "gloryPoints"
	};

	static readonly CLASS = {
		REQUIRED_LEVEL: 4,
		PRICE: 5000,
		GROUP1LEVEL: 16,
		GROUP2LEVEL: 32,
		GROUP3LEVEL: 48,
		GROUP4LEVEL: 80,
		TIME_BEFORE_CHANGE_CLASS: [
			2 * 7 * 24 * 60 * 60, // 2 weeks
			2 * 7 * 24 * 60 * 60, // 2 weeks
			4 * 7 * 24 * 60 * 60, // 4 weeks
			4 * 7 * 24 * 60 * 60, // 4 weeks
			4 * 7 * 24 * 60 * 60 // 4 weeks
		]
	};

	static readonly CLASSES = {
		RECRUIT: 0,
		FIGHTER: 1,
		SOLDIER: 2,
		INFANTRYMAN: 3,
		GLOVED: 4,
		HELMETED: 5,
		ENMESHED: 6,
		TANK: 7,
		ROCK_THROWER: 8,
		SLINGER: 9,
		ARCHER: 10,
		GUNNER: 11,
		ESQUIRE: 12,
		HORSE_RIDER: 13,
		PIKEMAN: 14,
		KNIGHT: 15,
		PALADIN: 16,
		VETERAN: 17,
		POWERFUL_INFANTRYMAN: 18,
		IMPENETRABLE_TANK: 19,
		FORMIDABLE_GUNNER: 20,
		VALIANT_KNIGHT: 21,
		LUMINOUS_PALADIN: 22,
		EXPERIENCED_VETERAN: 23,
		MYSTIC_MAGE: 24
	};

	static readonly LOGS = {
		LOG_COUNT_LINE_LIMIT: 50000,
		BASE_PATH: "./logs"
	};

	static readonly MISSION_SHOP = {
		RANGE_MISSION_MONEY: 1350,
		BASE_RATIO: 6500,
		SEED_RANGE: 1000,
		SIN_RANDOMIZER: 100000,
		KINGS_MONEY_VALUE_THRESHOLD_MISSION: 6500,
		PRICES: {
			MONEY: 50,
			VALUABLE_ITEM: 30,
			THOUSAND_POINTS: 5,
			PET_INFORMATION: 3,
			MISSION_SKIP: 10,
			BADGE: 150
		},
		THOUSAND_POINTS: 1000
	};

	static readonly BEGINNING = {
		START_MAP_LINK: 83,
		LAST_MAP_LINK: 77
	};

	static readonly MISSIONS = {
		SLOT_3_LEVEL: 55,
		SLOT_2_LEVEL: 25,
		SLOTS_LEVEL_PROBABILITIES: [
			{
				LEVEL: 0,
				EASY: 1,
				MEDIUM: 0,
				HARD: 0
			},
			{
				LEVEL: 10,
				EASY: 0.75,
				MEDIUM: 0.25,
				HARD: 0
			},
			{
				LEVEL: 20,
				EASY: 0.4,
				MEDIUM: 0.6,
				HARD: 0
			},
			{
				LEVEL: 40,
				EASY: 0.25,
				MEDIUM: 0.65,
				HARD: 0.1
			},
			{
				LEVEL: 50,
				EASY: 0.2,
				MEDIUM: 0.55,
				HARD: 0.25
			},
			{
				LEVEL: 60,
				EASY: 0.1,
				MEDIUM: 0.4,
				HARD: 0.5
			}
		],
		DAILY_MISSION_MONEY_MULTIPLIER: 0.5,
		DAILY_MISSION_POINTS_MULTIPLIER: 3.5
	};

	static readonly MINIMAL_PLAYER_SCORE = 100;

	static EXCLUDED_TRANSLATION_MODULES = [
		"classes.",
		"advices"
	];

	static readonly MAX_TIME_BOT_RESPONSE = 30000;

	static readonly DM = {
		TITLE_SUPPORT: "{pseudo}, welcome to the DraftBot Assistance Program.",
		// eslint-disable-next-line max-len
		MESSAGE_SUPPORT: ":flag_gb: If you want to receive help, select your language using reactions below. If you don't need help, please ignore this message.\n:warning: **Every message sent here can be read by human!**\n\n:flag_fr: Si vous avez besoin d'aide, sélectionnez votre langue en utilisant les réactions ci-dessous. Si vous n'avez pas besoin d'aide, ignorez ce message.\n:warning: **Chaque message envoyé ici peut être lu par un humain !**",
		ALERT_ICON: "\uD83D\uDD15 ",
		// eslint-disable-next-line max-len
		INTERACTION_SUPPORT: ":flag_gb: Hello, commands are disabled in private messages. Please go on a server to play!\n\n:flag_fr: Bonjour, les commandes sont désactivées en messages privés. Merci d'aller sur un serveur pour jouer !",
		TOO_LONG_MESSAGE: "*Message trop long, voir l'attaché dans le message.*",
		NO_MESSAGE: "*Aucun message*",
		COMMENT_MESSAGE_START: ">>> ",
		MAX_ATTACHMENTS: 10,
		MAX_MESSAGE_LENGTH_ALLOWED: 1900
	};

	static readonly REACTIONS = {
		VALIDATE_REACTION: "✅",
		REFUSE_REACTION: "❌",
		WAIT_A_BIT_REACTION: "⏳",
		START_FIGHT_REACTION: "⚔️",
		NOT_REPLIED_REACTION: "🔚",
		SHOPPING_CART: "🛒",
		WARNING: "⚠️",
		NUMBERS: [
			"0️⃣",
			"1️⃣",
			"2️⃣",
			"3️⃣",
			"4️⃣",
			"5️⃣",
			"6️⃣",
			"7️⃣",
			"8️⃣",
			"9️⃣",
			"🔟"
		],
		FRENCH_FLAG: "🇫🇷",
		ENGLISH_FLAG: "🇬🇧",
		INVENTORY_RESERVE: "🔃",
		MONEY_ICON: "💰",
		TRASH: "🗑️",
		INVENTORY_EXTENSION: "📦",
		ITEM_CATEGORIES: [
			"⚔️",
			"🛡️",
			"⚗️",
			"🧸"
		]
	};

	static readonly CACHE_TIME = {
		INTERACTIONS: 900000
	};

	static readonly PROFILE = {
		DISPLAY_ALL_BADGE_EMOTE: "🎖️",
		MAX_EMOTE_DISPLAY_NUMBER: 10
	};

	static readonly DEFAULT_HEALED_EFFECT = ":hospital:";

	static readonly JOIN_BOAT_SCORE_SUBTRAHEND = 30;

	static readonly DEFAULT_ERROR = "Hmmm... Something went very (very) wrong. Please share this issue with us here :\n\n" +
		"https://github.com/DraftBot-A-Discord-Adventure/DraftBot/issues/new?assignees=&labels=bug&template=bug_report.yml&title=%5BBUG%5D%3A+";
}

export type ConstantRange = { MIN: number, MAX: number };