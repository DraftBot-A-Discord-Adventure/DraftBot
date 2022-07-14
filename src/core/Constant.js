// Effect
global.EFFECT = {
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

global.GUILD = {
	REQUIRED_LEVEL: 10,
	MAX_GUILD_MEMBER: 6,
	MAX_GUILD_NAME_SIZE: 15,
	MIN_GUILD_NAME_SIZE: 2,
	MIN_DESCRIPTION_LENGTH: 2,
	MAX_DESCRIPTION_LENGTH: 140,
	MAX_COMMON_PET_FOOD: 25,
	MAX_HERBIVOROUS_PET_FOOD: 15,
	MAX_CARNIVOROUS_PET_FOOD: 15,
	MAX_ULTIMATE_PET_FOOD: 5
};

global.PROGRESSBARS_SIZE = 20;

global.SHOP = {
	QUESTION: "❓",
	HOSPITAL: "🏥",
	HEART: "💗",
	MONEY_MOUTH: "🤑",
	POTION_REPLACEMENT: "🍷"
};

global.TOPGG = {
	BADGE: "🗳️",
	BADGE_DURATION: 12,
	ROLE_DURATION: 24,
	DBL_SERVER_COUNT_UPDATE_TIME: 1800000
};

global.LOGS = {
	LOG_COUNT_LINE_LIMIT: 50000
};

global.TEST_EMBED_COLOR = {
	SUCCESSFUL: "#FF8888",
	ERROR: "#FF0000"
};

global.typeVariable = {
	INTEGER: {
		type: "number",
		check: (v) => !isNaN(v)
	},
	MENTION: {
		type: "mention",
		check: (v) => isAMention(v)
	},
	EMOJI: {
		type: "emoji",
		check: (v) => isAnEmoji(v)
	},
	STRING: {
		type: "string",
		check: () => false
	}
};
