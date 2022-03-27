export abstract class Constants {
	static readonly REACTIONS = {
		VALIDATE_REACTION: "✅",
		REFUSE_REACTION: "❌",
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

	static readonly MESSAGES = {
		COLLECTOR_TIME: 120000,
		COLORS: {
			DEFAULT: "NOT_QUITE_BLACK",
			ERROR: "#D92D43",
			SUCCESSFUL: "#5EAD45"
		}
	};

	static readonly TOPGG = {
		BADGE: "🗳️",
		BADGE_DURATION: 12,
		ROLE_DURATION: 24,
		DBL_SERVER_COUNT_UPDATE_TIME: 1800000
	};

	static readonly ITEM_CATEGORIES = {
		WEAPON: 0,
		ARMOR: 1,
		POTION: 2,
		OBJECT: 3
	};

	static readonly COMMAND_CATEGORY = {
		SERVER: "server",
		UTIL: "util",
		PLAYER: "player",
		MISSION: "mission",
		GUILD: "guild",
		PET: "pet"
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
		MYTHICAL: 8
	};

	static readonly RARITIES_VALUES = {
		"0": 0,
		"1": 20,
		"2": 40,
		"3": 100,
		"4": 250,
		"5": 580,
		"6": 1690,
		"7": 5000,
		"8": 10000
	};

	static readonly RARITIES_GENERATOR = {
		VALUES: [
			4375,
			6875,
			8375,
			9375,
			9875,
			9975,
			9998
		],
		MAX_VALUE: 10000
	};

	static readonly ITEM_GENERATOR = {
		"max": "10",
		"tab": {
			"1": "weapons",
			"2": "weapons",
			"3": "weapons",
			"4": "armors",
			"5": "armors",
			"6": "armors",
			"7": "objects",
			"8": "objects",
			"9": "potions",
			"10": "potions"
		}
	};

	static readonly TOP = {
		PLAYERS_BY_PAGE: 15,
		DAYS_BEFORE_INACTIVE: 7
	};

	static readonly TOP_WEEK: {
		PLAYERS_BY_PAGE: "15"
	};

	static readonly TOP_SERV: {
		PLAYERS_BY_PAGE: "15"
	};

	static readonly XP: {
		BASE_VALUE: 325,
		COEFFICIENT: 1.041,
		MINUS: 188
	}

	static readonly ITEM_NATURE = {
		NO_EFFECT: 0,
		HEALTH: 1,
		SPEED: 2,
		ATTACK: 3,
		DEFENSE: 4,
		TIME_SPEEDUP: 5,
		MONEY: 6
	};

	static readonly BACKUP = {
		DATABASE_BACKUP_INTERVAL: 12 * 60 * 60 * 1000,
		LOCAL_SPACE_LIMIT: 500 * 1024 * 1024
	}

	static readonly REPORT = {
		TIME_BETWEEN_BIG_EVENTS: 2 * 60 * 60 * 1000, // 2 hours
		BONUS_POINT_TIME_DIVIDER: 6,
		POINTS_BY_SMALL_EVENT: 50,
		PATH_SQUARE_COUNT: 16,
		TIME_BETWEEN_MINI_EVENTS: 10 * 60 * 1000, // 10 minutes
		QUICK_END_EMOTE: "🔚"
	};

	static readonly PETS = {
		IS_FOOD: 1,
		MALE: "m",
		FEMALE: "f",
		FREE_COOLDOWN: 60 * 60 * 1000, // 1 hour
		BREED_COOLDOWN: 60 * 60 * 1000, // 1 hour
		MAX_LOVE_POINTS: 100,
		BASE_LOVE: 10,
		GUILD_LEVEL_USED_FOR_NO_GUILD_LOOT: 20,
		LOVE_LEVELS: [5, 20, 50],
		SELL: {
			MIN: 100,
			MAX: 50000
		}
	};

	static readonly CLASS = {
		REQUIRED_LEVEL: 4,
		PRICE: 5000,
		GROUP1LEVEL: 16,
		GROUP2LEVEL: 32,
		GROUP3LEVEL: 48
	}

	static readonly FIGHT = {
		MAX_SPEED_IMPROVEMENT: 30,
		MAX_TURNS: 25,
		REQUIRED_LEVEL: 8,
		POINTS_REGEN_MINUTES: 15,
		POINTS_REGEN_AMOUNT: 50,
		ACTION: {
			QUICK_ATTACK: 0,
			SIMPLE_ATTACK: 1,
			POWERFUL_ATTACK: 2,
			BULK_ATTACK: 3,
			IMPROVE_SPEED: 4,
			ULTIMATE_ATTACK: 5
		}
	}

	static readonly GUILD = {
		REQUIRED_LEVEL: 10,
		MAX_GUILD_MEMBER: 6,
		MAX_GUILD_NAME_SIZE: 15,
		MIN_GUILD_NAME_SIZE: 2,
		MIN_DESCRIPTION_LENGTH: 2,
		MAX_DESCRIPTION_LENGTH: 140,
		MAX_LEVEL: 100,
		MAX_PET_FOOD: [
			25,
			15,
			15,
			5
		]
	};

	static readonly NATURE = {
		NONE: 0,
		HEALTH: 1,
		SPEED: 2,
		ATTACK: 3,
		DEFENSE: 4,
		HOSPITAL: 5,
		MONEY: 6
	}

	static readonly LOGS = {
		LOG_COUNT_LINE_LIMIT: 50000
	}

	static readonly EFFECT = {
		EMOJIS: {
			":baby:": "👶",
			":smiley:": "😃",
			":clock10:": "🕙", // may be deleted : is used to avoir interaction when the bot is awaiting an answer
			":skull:": "💀",
			":sleeping:": "😴",
			":zany_face:": "🤪",
			":cold_face:": "🥶",
			":head_bandage:": "🤕",
			":sick:": "🤢",
			":lock:": "🔒",
			":dizzy_face:": "😵",
			":clock2:": "🕑",
			":drooling_face:": "🤤",
			":confounded:": "😖",
			":scream:": "😱"
		},
		BABY: ":baby:",
		SMILEY: ":smiley:",
		AWAITING_ANSWER: ":clock10:", // may be deleted : is used to avoir interaction when the bot is awaiting an answer
		DEAD: ":skull:",
		SLEEPING: ":sleeping:",
		DRUNK: ":zany_face:",
		FROZEN: ":cold_face:",
		HURT: ":head_bandage:",
		SICK: ":sick:",
		LOCKED: ":lock:",
		INJURED: ":dizzy_face:",
		OCCUPIED: ":clock2:",
		STARVING: ":drooling_face:",
		CONFOUNDED: ":confounded:",
		SCARED: ":scream:"
	};

	static readonly MISSION_SHOP = {
		RANGE_MISSION_MONEY: 300,
		BASE_RATIO: 2500,
		SEED_RANGE: 1000
	};

	static readonly BEGINNING = {
		START_MAP_LINK: 83,
		LAST_MAP_LINK: 77
	};

	static readonly LOTTERY_REWARD_TYPES = {
		XP: "xp",
		MONEY: "money",
		GUILD_XP: "guildXp",
		POINTS: "points"
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
		DAILY_MISSION_MONEY_PENALITY: 2
	};

	static readonly PROFILE = {
		DISPLAY_ALL_BADGE_EMOTE: "🎖️"
	}

	static readonly BADGES = {
		POWERFUL_GUILD: "💎",
		STAFF_MEMBER: "⚙️",
		QUEST_MASTER: "💍",
		RICH_PERSON: "🤑",
		PET_TAMER: "💞",
		LIST: [
			"🏆",
			"🏅",
			"👑",
			"⚙️",
			"🥚",
			"❤️",
			"🍀",
			"💸",
			"🐞",
			"🎰",
			"⛑️",
			"🥇",
			"🤑",
			"🌟",
			"🖋️",
			"🌍",
			"🎗️",
			"🎄",
			"😂",
			"💎",
			"⚔️",
			"🗳️",
			"🔖",
			"💞",
			"\uD83D\uDC8D"
		]
	}

	static readonly SMALL_EVENT = {
		MINIMUM_HEALTH_WON: 1,
		MAXIMUM_HEALTH_WON: 4,
		SHOP_RESALE_MULTIPLIER: 0.1,
		MINIMUM_EXPERIENCE_WON: 10,
		MAXIMUM_EXPERIENCE_WON: 35,
		MINIMUM_GUILD_EXPERIENCE_WON: 20,
		MAXIMUM_GUILD_EXPERIENCE_WON: 80,
		MINIMUM_MONEY_WON_VOTE: 150,
		MAXIMUM_MONEY_WON_VOTE: 250,
		MINIMUM_HEALTH_LOST_SMALL: 1,
		MAXIMUM_HEALTH_LOST_SMALL: 5,
		MINIMUM_TIME_LOST_SMALL: 1,
		MAXIMUM_TIME_LOST_SMALL: 24,
		MINIMUM_MONEY_LOST_SMALL: 10,
		MAXIMUM_MONEY_LOST_SMALL: 50,
		MINIMUM_HEALTH_LOST_BIG: 5,
		MAXIMUM_HEALTH_LOST_BIG: 30,
		MINIMUM_MONEY_LOST_BIG: 50,
		MAXIMUM_MONEY_LOST_BIG: 250,
		MINIMUM_MONEY_WON_CLASS: 50,
		MAXIMUM_MONEY_WON_CLASS: 150,
		MINIMUM_HEALTH_WON_CLASS: 1,
		MAXIMUM_HEALTH_WON_CLASS: 5,
		LOTTERY_REWARDS: {
			EXPERIENCE: 40,
			MONEY: 50,
			GUILD_EXPERIENCE: 70,
			POINTS: 35
		},
		MINIMUM_LEVEL_GOOD_PLAYER_FOOD_MERCHANT: 30,
		MINIMUM_MONEY_WON_ULTIMATE_FOOD_MERCHANT: 20,
		BASE_TIME_LOST_GOBLETS_GAME: 1,
		BASE_HEALTH_LOST_GOBLETS_GAME: 5
	}

	static readonly LANGUAGE = {
		FRENCH: "fr",
		ENGLISH: "en"
	}

	static readonly MENU_REACTION = {
		ACCEPT: "✅",
		DENY: "❌",
		FRENCH_FLAG: "🇫🇷",
		ENGLISH_FLAG: "🇬🇧"
	};

	static readonly ITEMS = {
		MAPPER: [
			1,
			1.5,
			2.1,
			2.8,
			3.6,
			4.5,
			5.5,
			6.6,
			6.7
		],
		SLOTS: {
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
		}
	};

	static readonly PET_FOOD = {
		TYPE: [
			"commonFood",
			"herbivorousFood",
			"carnivorousFood",
			"ultimateFood"
		],
		EMOTE: [
			"\uD83C\uDF6C",
			"\uD83E\uDD6C",
			"\uD83E\uDD69",
			"\uD83C\uDF72"
		],
		PRICE: [
			20,
			250,
			250,
			600
		],
		EFFECT: [
			1,
			3,
			3,
			5
		]
	};

	static readonly ROLES = {
		GUILD: {
			NONE: "none",
			MEMBER: "member",
			ELDER: "elder",
			CHIEF: "chief"
		},
		USER: {
			ADMINISTRATOR: "administrator",
			BADGE_MANAGER: "manager",
			CONTRIBUTORS: "contributors",
			BOT_OWNER: "owner"
		}
	};

	static readonly MAX_TIME_BOT_RESPONSE = 30000;
}