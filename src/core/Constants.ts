import {isAMention, isAnEmoji} from "./utils/StringUtils";
import {HexColorString} from "discord.js";

export type ConstantRange = {MIN: number, MAX: number};

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
			DEFAULT: "default",
			ERROR: "#D92D43",
			SUCCESSFUL: "#5EAD45"
		},
		PROGRESS_BAR_SIZE: 20,
		MAX_SPAM_COUNT: 3
	};

	static readonly TOPGG = {
		BADGE: "🗳️",
		BADGE_DURATION: 12,
		ROLE_DURATION: 24
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

	static readonly RARITIES_VALUES = [
		0, // basic
		20, // common
		40, // uncommon
		100, // exotic
		250, // rare
		580, // special
		1690, // epic
		5000, // legendary
		10000 // mythic
	];

	static readonly RARITIES_GENERATOR = {
		VALUES: [ // common
			4375, // uncommon
			6875, // exotic
			8375, // rare
			9375, // special
			9875, // epic
			9975, // legendary
			9998 // mythic
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
		HOURS_USED_TO_CALCULATE_FIRST_REPORT_REWARD: 1, // used to get the amount of point a user will get in the first report, 1 hour = 60 points ( + some bonus )
		TIME_BETWEEN_BIG_EVENTS: 2 * 60 * 60 * 1000, // 2 hours
		BONUS_POINT_TIME_DIVIDER: 6,
		POINTS_BY_SMALL_EVENT: 50,
		PATH_SQUARE_COUNT: 16,
		TIME_BETWEEN_MINI_EVENTS: 9.75 * 60 * 1000, // 9 minutes and 45 seconds
		QUICK_END_EMOTE: "🔚"
	};

	// This constant represent the different types of values on which the players can be ranked
	static readonly RANK_TYPES = {
		LEVEL: "level",
		SCORE: "score",
		WEEKLY_SCORE: "weeklyScore"
	};

	static readonly PETS = {
		IS_FOOD: 1,
		NICKNAME_LENGTH_RANGE: {
			MIN: 3,
			MAX: 16
		},
		MALE: "m",
		FEMALE: "f",
		BREED_COOLDOWN: 60 * 60 * 1000, // 1 hour
		MAX_LOVE_POINTS: 100,
		BASE_LOVE: 10,
		GUILD_LEVEL_USED_FOR_NO_GUILD_LOOT: 20,
		LOVE_LEVELS: [5, 20, 50],
		LOVE_LEVEL: {
			FEISTY: 1,
			WILD: 2,
			FEARFUL: 3,
			TAMED: 4,
			TRAINED: 5
		},
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
	};

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
	};

	static readonly NATURE = {
		NONE: 0,
		HEALTH: 1,
		SPEED: 2,
		ATTACK: 3,
		DEFENSE: 4,
		HOSPITAL: 5,
		MONEY: 6
	};

	static readonly LOGS = {
		LOG_COUNT_LINE_LIMIT: 50000
	};

	static readonly DEFAULT_HEALED_EFFECT = ":hospital:";

	static readonly MISSION_SHOP = {
		RANGE_MISSION_MONEY: 1350,
		BASE_RATIO: 6500,
		SEED_RANGE: 1000
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
		DAILY_MISSION_MONEY_PENALITY: 2
	};

	static readonly PROFILE = {
		DISPLAY_ALL_BADGE_EMOTE: "🎖️",
		MAX_EMOTE_DISPLAY_NUMBER: 10
	};

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
			"💍"
		]
	};

	static readonly LANGUAGE = {
		FRENCH: "fr",
		ENGLISH: "en"
	};

	static readonly MENU_REACTION = {
		ACCEPT: "✅",
		DENY: "❌",
		FRENCH_FLAG: "🇫🇷",
		ENGLISH_FLAG: "🇬🇧"
	};

	static readonly PET_FOOD = {
		COMMON_FOOD: "commonFood",
		CARNIVOROUS_FOOD: "carnivorousFood",
		HERBIVOROUS_FOOD: "herbivorousFood",
		ULTIMATE_FOOD: "ultimateFood"
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

	static readonly PET_FOOD_GUILD_SHOP = {
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

	static readonly MINIMAL_PLAYER_SCORE = 100;

	static readonly PERMISSION = {
		ROLE: {
			BOT_OWNER: "owner", // is the owner of the bot
			BADGE_MANAGER: "manager", // has the badge manager role
			SUPPORT: "support", // has the support role
			ADMINISTRATOR: "administrator", // has the admin permission in a server where the bot is.
			CONTRIBUTORS: "contributors",
			ALL: "all"
		}
	};

	static readonly TEST_VAR_TYPES = {
		INTEGER: {
			type: "number",
			check: (v: number): boolean => !isNaN(v)
		},
		MENTION: {
			type: "mention",
			check: (v: string): boolean => isAMention(v)
		},
		EMOJI: {
			type: "emoji",
			check: (v: string): boolean => isAnEmoji(v)
		},
		STRING: {
			type: "string",
			check: (): boolean => false
		}
	};

	static readonly TEST_EMBED_COLOR = {
		SUCCESSFUL: <HexColorString>"#FF8888",
		ERROR: <HexColorString>"#FF0000"
	};

	static readonly MAX_DAILY_POTION_BUYOUTS: number = 5;
}