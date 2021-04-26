// Defines allowed datasource
global.DATASOURCE = {
	SQLITE: "sqlite",
	JSON: "json",
};

// Effect
global.EFFECT = {
	BABY: ":baby:",
	SMILEY: ":smiley:",
	AWAITINGANSWER: ":clock10:", // may be deleted : is used to avoir interaction when the bot is awaiting an answer
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
};

global.LANGUAGE = {
	FRENCH: "fr",
	ENGLISH: "en",
};

// Object nature
global.NATURE = {
	NONE: 0,
	HEALTH: 1,
	SPEED: 2,
	ATTACK: 3,
	DEFENSE: 4,
	HOSPITAL: 5,
	MONEY: 6,
};

global.PERMISSION = {
	ROLE: {
		BOTOWNER: "owner", // is the owner of the bot
		BADGEMANAGER: "manager", // has the badge manager role
		SUPPORT: "support", // has the support role
		ADMINISTRATOR: "administrator", // has the admin permission in a server where the bot is.
		TOURNAMENT: "tournament", // has the permission to use the tournament command
		CONTRIBUTORS: "contributors",
		ALL: "all",
	},
};

global.REWARD_TYPES = {
	PERSONAL_XP: "personalXP",
	GUILD_XP: "guildXp",
	HOSPITAL: "hospital",
	MONEY: "money",
	FIXED_MONEY: "fixedMoney",
	BADGE: "badge",
	FULL_HEAL: "fullHeal",
	PARTIAL_HEAL: "partialHeal",
	ALTERATION: "alterationHeal",
	PET_FOOD: "petFood",
};

global.ITEMTYPE = {
	POTION: "potions",
	WEAPON: "weapons",
	ARMOR: "armors",
	OBJECT: "objects",
};

global.GUILD = {
	REQUIRED_LEVEL: 10,
	MAX_GUILD_MEMBER: 6,
	MAX_GUILDNAME_SIZE: 15,
	MIN_GUILDNAME_SIZE: 2,
	MIN_DESCRIPTION_LENGTH: 2,
	MAX_DESCRIPTION_LENGTH: 140,
	MAX_COMMON_PETFOOD: 25,
	MAX_HERBIVOROUS_PETFOOD: 15,
	MAX_CARNIVOROUS_PETFOOD: 15,
	MAX_ULTIMATE_PETFOOD: 5,
};

global.CLASS = {
	REQUIRED_LEVEL: 4,
	PRICE: 5000,
	GROUP1LEVEL: 16,
	GROUP2LEVEL: 32,
	GROUP3LEVEL: 48,
};

global.CATEGORY = {
	SERVER: "server",
	UTIL: "util",
	PLAYER: "player",
	GUILD: "guild",
	PET: "pet",
};
global.MENU_REACTION = {
	ACCEPT: "✅",
	DENY: "❌",
	FRENCH_FLAG: "🇫🇷",
	ENGLISH_FLAG: "🇬🇧",
};

global.PROGRESSBARS_SIZE = 20;

global.FIGHT = {
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
		ULTIMATE_ATTACK: 5,
	},
};

global.SHOP = {
	QUESTION: "❓",
	HOSPITAL: "🏥",
	HEART: "💗",
	MONEY_MOUTH: "🤑",
	POTION_REPLACEMENT: "🍷",
};

global.GUILDSHOP = {
	STAR: "⭐",
	COMMON_FOOD: "🍬",
	HERBIVOROUS_FOOD: "🥬",
	CARNIVOROUS_FOOD: "🥩",
	ULTIMATE_FOOD: "🍲",
};

global.QUANTITY = {
	ONE: "1️⃣",
	FIVE: "5️⃣",
	TEN: "🔟",
};

global.PETFREE = {
	MEAT_GIVEN: 1,
	GIVE_MEAT_PROBABILITY: 0.1,
	FREE_FEISTY_COST: 1000
}

global.TOPGG = {
	BADGE: "🗳️",
	BADGE_DURATION: 12,
	ROLE_DURATION: 24,
	DBL_SERVER_COUNT_UPDATE_TIME: 1800000,
};

global.PETS = {
	MALE : "m",
	FEMALE : "f",
	FREE_COOLDOWN: 60 * 60 * 1000, // 1 hour
	BREED_COOLDOWN: 60 * 60 * 1000, // 1 hour
	MAX_LOVE_POINTS: 100,
	BASE_LOVE: 10,
	LOVE_LEVELS: [5, 20, 50],
	SELL: {
		MIN: 100,
		MAX: 50000,
	},
};
global.UNLOCK = {
	PRICE_FOR_UNLOCK: 3000,
};

global.LOGS = {
	LOG_COUNT_LINE_LIMIT: 50000,
};

global.REPORT = {
	TIME_BETWEEN_BIG_EVENTS: 2 * 60 * 60 * 1000,
	SMALL_EVENTS_COUNT: 3
}

global.COLLECTOR_TIME = 120000;