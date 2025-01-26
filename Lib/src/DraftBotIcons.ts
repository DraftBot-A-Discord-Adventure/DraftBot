type EventPossibilities = {
	"end": { [outcomeId: string]: string };
} & Record<string, string | { [outcomeId: string]: string }>

export const DraftBotIcons: {
	effects: {
		[effectId: string]: string
	},
	events: {
		[eventId: string]: EventPossibilities;
	},
	map_types: {
		[mapType: string]: string
	},
	small_events: {
		[smallEventId: string]: string
	},
	pets: {
		[petId: string]: {
			emoteFemale: string,
			emoteMale: string
		}
	},
	armors: {
		[itemId: string]: string
	},
	weapons: {
		[itemId: string]: string
	},
	potions: {
		[itemId: string]: string
	},
	objects: {
		[itemId: string]: string
	},
	classes: {
		[classId: string]: string
	},
	witch_small_event: {
		[ingredient: string]: string
	},
	cart_small_event: {
		accept: string,
		refuse: string
	},
	fight_command: {
		accept: string,
		refuse: string,
		"crossed_swords": string
	},
	foods: {
		[foodId: string]: string
	}
	collectors: {
		accept: string,
		refuse: string,
		lottery: {
			easy: string,
			medium: string,
			hard: string
		},
		interactPoorCoin: string,
		warning: string,
		question: string
	},
	fight_actions: {
		[actionId: string]: string
	},
	class_kinds: {
		[classKind: string]: string
	},
	announcements: {
		trophy: string
	},
	commands: {
		[commandId: string]: string
	},
	unitValues: {
		[unitValueId: string]: string
	},
	shopItems: {
		[shopItemId: string]: string
	},
	badges: {
		[badgeId: string]: string
	},
	itemKinds: string[],
	notifications: {
		bell: string,
		sendLocation: string,
		back: string,
		types: { [notificationId: string]: string }
	},
	missions: {
		[missionId: string]: string
	},
	messages: {
		[messageId: string]: string
	},
	fightPetActions: {
		[actionId: string]: string
	},
	rewards: {
		[rewardId: string]: string
	},
	goblets: {
		[gobletId: string]: string
	},
	sex: {
		male: string,
		female: string
	},
	diet: {
		[dietId: string]: string
	},
	petInformation: {
		[petInfoId: string]: string
	},
	leagues: {
		[leagueId: string]: string
	},
	top: {
		badges: {
			first: string,
			second: string,
			third: string,
			fourth: string,
			fifth: string,
			self: string,
			sameContext: string,
			default: string
		},
		afk: string,
		allTime: string,
		weekly: string,
		congrats: string,
		error: string,
		guild: string
	}
} = {
	"effects": {
		"not_started": "👶",
		"dead": "💀",
		"none": "😃",
		"sleeping": "😴",
		"drunk": "🤪",
		"freezing": "🥶",
		"hurt": "🤕",
		"sick": "🤢",
		"jailed": "🔒",
		"injured": "😵",
		"occupied": "🕑",
		"starving": "🤤",
		"confounded": "😖",
		"scared:": "😱",
		"lost": "🧐",
		"healed": "🏥"
	},
	"events": {
		"1": {
			"cutTree": "🪓",
			"end": {
				"0": "🪓"
			},
			"otherWay": "🚶"
		},
		"10": {
			"end": {
				"0": "🚶"
			},
			"help": "🎣",
			"push": "🖐️",
			"skip": "🏃"
		},
		"11": {
			"end": {
				"0": "🚶"
			},
			"followHint": "👈",
			"forest": "🌳",
			"oppositeSide": "👉"
		},
		"12": {
			"craftBoat": "🚣",
			"end": {
				"0": "🕑"
			},
			"otherWay": "🚶",
			"searchBridge": "🌉",
			"swim": "🏊"
		},
		"13": {
			"end": {
				"0": "🚶"
			},
			"goAway": "🚶",
			"goForge": "🔨",
			"goInn": "🏠",
			"goMarket": "🎪"
		},
		"14": {
			"chatWorker": "🔨",
			"end": {
				"0": "🚶"
			},
			"goAway": "🚶",
			"stayNight": "🛏️"
		},
		"15": {
			"end": {
				"0": "🚶"
			},
			"skip": "🏃",
			"steal": "💰",
			"trade": "👥"
		},
		"16": {
			"end": {
				"0": "🚶",
				"1": "🚶"
			},
			"enterCastle": "🔎",
			"skip": "➡️",
			"walkAround": "🔁"
		},
		"17": {
			"end": {
				"0": "🚶",
				"1": "🚶"
			},
			"fruits": "🍎",
			"hunt": "🦌",
			"mushrooms": "🍄",
			"salad": "🥗",
			"skip": "🚶"
		},
		"18": {
			"end": {
				"0": "🚶"
			},
			"searchScaffolding": "⛓️",
			"searchSite": "🔎",
			"skip": "🚶"
		},
		"19": {
			"butch": "🔪",
			"cook": "🍽️",
			"end": {
				"0": "👀"
			},
			"skip": "🚶"
		},
		"2": {
			"end": {
				"0": "🐶"
			},
			"followDog": "🐕",
			"skip": "🏃"
		},
		"20": {
			"alert": "🤙",
			"end": {
				"0": "🚶",
				"1": "🚶"
			},
			"skip": "🚶",
			"surpriseAttack": "👊"
		},
		"21": {
			"crossBridge": "🌉",
			"end": {
				"0": "🕑",
				"1": "🚶"
			},
			"otherWay": "🚶"
		},
		"22": {
			"buy": "💶",
			"end": {
				"0": "👀",
				"1": "👀"
			},
			"skip": "🏃",
			"steal": "👥"
		},
		"23": {
			"end": {
				"0": "👀"
			},
			"help": "🔨",
			"skip": "🚶"
		},
		"24": {
			"end": {
				"0": "🚶",
				"1": "🚶"
			},
			"foodStand": "🍢",
			"gameStand": "🎯",
			"itemStand": "🎪"
		},
		"25": {
			"dontHelp": "🚶",
			"end": {
				"0": "👀",
				"1": "👀"
			},
			"help": "🤝",
			"steal": "🕵️"
		},
		"26": {
			"end": {
				"0": "👀"
			},
			"goAway": "🚶",
			"steal": "💸",
			"trySave": "👊"
		},
		"27": {
			"end": {
				"0": "👀",
				"1": "👀"
			},
			"goDown": "👇",
			"skip": "🚶",
			"useBucket": "🤝"
		},
		"28": {
			"accept": "✅",
			"deny": "❌",
			"end": {
				"0": "🚶"
			}
		},
		"29": {
			"end": {
				"0": "👀",
				"1": "🚶"
			},
			"restHere": "😴",
			"restTree": "🌳",
			"searchWater": "🔍"
		},
		"3": {
			"abandon": "▶️",
			"end": {
				"0": "▶️"
			},
			"mineIt": "⛏️",
			"searchKey": "🔑"
		},
		"30": {
			"duke": "🤴",
			"end": {
				"0": "🚶",
				"1": "🚶"
			},
			"gift": "🎁",
			"party": "🎉",
			"steal": "🍌"
		},
		"31": {
			"end": {
				"0": "🚶"
			},
			"hide": "🌿",
			"keepGoing": "🚶",
			"wave": "👋"
		},
		"32": {
			"end": {
				"0": "🚶",
				"1": "🚶",
				"2": "🚶",
				"3": "🚶"
			},
			"heal": "💉",
			"kill": "🔪",
			"yell": "🗣️"
		},
		"33": {
			"chat": "👄",
			"eat": "🍗",
			"end": {
				"0": "🐐",
				"1": "🫕"
			},
			"skip": "🚶",
			"steal": "🕵️"
		},
		"34": {
			"end": {
				"0": "🚶",
				"1": "🚶‍",
				"2": "🚶‍"
			},
			"food": "🥗",
			"health": "😇",
			"kind": "🍀",
			"money": "💰"
		},
		"35": {
			"deny": "❌",
			"end": {
				"0": "🚶"
			},
			"steal": "💰",
			"test": "🍺"
		},
		"36": {
			"end": {
				"0": "🚶‍",
				"1": "🚶"
			},
			"goAway": "🚶",
			"goInn": "🏡",
			"stealJeweler": "💸",
			"talkJeweler": "🗣️"
		},
		"37": {
			"end": {
				"0": "🌳",
				"1": "🌳"
			},
			"run": "🏃",
			"walk": "🚶"
		},
		"38": {
			"buyCheap": "💸",
			"buyExpensive": "💰",
			"deny": "❌",
			"end": {
				"0": "🚶",
				"1": "👥",
				"2": "👥"
			},
			"steal": "🕵️"
		},
		"39": {
			"convoy": "🚶",
			"end": {
				"0": "🗣️",
				"1": "🗣️"
			},
			"meal": "🍖",
			"steal": "🤑"
		},
		"4": {
			"end": {
				"0": "🏃"
			},
			"skip": "🏃",
			"wish": "🗣️"
		},
		"40": {
			"askAdvices": "🗣️",
			"breakIn": "🔎",
			"end": {
				"0": "🚶",
				"1": "🚶"
			},
			"goBack": "🚶"
		},
		"41": {
			"corrupt": "🕵️",
			"end": {
				"0": "🗣️",
				"1": "🕑",
				"2": "🚶"
			},
			"escape": "🔓",
			"explain": "🗣️",
			"playDead": "💀",
			"wait": "🕑"
		},
		"42": {
			"ask": "🥩",
			"end": {
				"0": "🚶",
				"1": "🚶"
			},
			"feign": "😎",
			"help": "🏹"
		},
		"43": {
			"continue": "⬆️",
			"end": {
				"0": "🚶",
				"1": "🚶",
				"2": "🚶"
			},
			"fight": "⚔️",
			"goBack": "⬇️",
			"shelter": "⛪"
		},
		"44": {
			"end": {
				"0": "🚶"
			},
			"help": "🦸",
			"push": "😈",
			"watch": "😐"
		},
		"45": {
			"askJoin": "⤴️",
			"end": {
				"0": "🕵️",
				"1": "🚶"
			},
			"goAlone": "🚶",
			"skip": "▶️",
			"talk": "🔊"
		},
		"46": {
			"end": {
				"0": "🚶",
				"1": "🔪",
				"2": "💊"
			},
			"singCrazyLove": "🤪",
			"singHero": "⚔️",
			"singLove": "🥰",
			"singRoyalty": "👑",
			"singWork": "🪕"
		},
		"47": {
			"end": {
				"0": "🚶",
				"1": "🏃",
				"2": "🕵️"
			},
			"goAway": "🚶",
			"help": "⚔",
			"tell": "🗣️"
		},
		"48": {
			"end": {
				"0": "🚶",
				"1": "🤔",
				"2": "🌌",
				"3": "🫂",
				"4": "😕"
			},
			"fight": "⚔️",
			"meetHim": "🤝"
		},
		"49": {
			"eatIt": "🍖",
			"end": {
				"0": "🐚",
				"1": "🐚",
				"2": "🐚"
			},
			"helpIt": "🤝",
			"takeIt": "💞"
		},
		"5": {
			"end": {
				"0": "🤑"
			},
			"keepGoing": "🚶",
			"rest": "💦"
		},
		"50": {
			"ask": "🗣️",
			"end": {
				"0": "Vous",
				"1": "L'un"
			},
			"leave": "🚶",
			"nap": "😴"
		},
		"51": {
			"end": {
				"0": "😴",
				"1": "💥",
				"2": "🦊"
			},
			"goBack": "🚶‍♂️",
			"search": "🔎",
			"stairs": "↗️"
		},
		"52": {
			"deny": "❌",
			"end": {
				"0": "🚶",
				"1": "👞",
				"2": "💸"
			},
			"play": "👥",
			"playFight": "⚔️",
			"teach": "🏹"
		},
		"53": {
			"accept": "✅",
			"deny": "❌",
			"end": {
				"0": "😶",
				"1": "🚶",
				"2": "🚶"
			},
			"steal": "🕵️"
		},
		"54": {
			"bet": "🪙",
			"end": {
				"0": "🗣",
				"1": "😵‍💫",
				"2": "🚶",
				"3": "🪙",
				"4": "🍖"
			},
			"help": "🤝",
			"look": "👥",
			"visit": "🚶"
		},
		"55": {
			"climb": "🧗",
			"cut": "🪓",
			"end": {
				"0": "🤷",
				"1": "🤷",
				"2": "👥"
			},
			"otherWay": "🚶"
		},
		"56": {
			"beach": "🏖",
			"drinkBlack": "⚫",
			"drinkRandom": "🍸",
			"end": {
				"0": "💥",
				"1": "😶",
				"2": "🍵"
			},
			"refuse": "❌"
		},
		"57": {
			"continue": "🌊",
			"end": {
				"0": "Vous",
				"1": "Vous",
				"2": "Vous"
			},
			"findMeal": "🦀",
			"settle": "🌞"
		},
		"58": {
			"continue": "🚶",
			"end": {
				"0": "Vous",
				"1": "Épuisé,"
			},
			"goAlchemist": "🍵",
			"shortcut": "🏃"
		},
		"6": {
			"end": {
				"0": "🕑"
			},
			"goAway": "🏃",
			"goDeeper": "🔦",
			"search": "🔍"
		},
		"60": {
			"end": {
				"0": "Vous"
			},
			"start": "📖"
		},
		"61": {
			"end": {
				"0": "Vous"
			},
			"follow": "🚶",
			"observe": "👀"
		},
		"62": {
			"deny": "✖️",
			"end": {
				"0": "🥓",
				"1": "🐕",
				"2": "🐝"
			},
			"searchPatures": "🍀",
			"searchVines": "🍇",
			"searchWheat": "🎑"
		},
		"63": {
			"end": {
				"0": "🎆",
				"1": "🍺",
				"2": "🗯️",
				"3": "💡"
			},
			"faceThem": "⚔️",
			"goAway": "🏃",
			"helpThem": "😈",
			"warnEveryone": "🔊"
		},
		"64": {
			"accept": "🏰",
			"deny": "❌",
			"end": {
				"0": "🤔"
			}
		},
		"65": {
			"end": {
				"0": "💰",
				"1": "❤️",
				"2": "💎",
				"3": "⭐",
				"4": "🏅",
				"5": "⚔️",
				"6": "🛡️",
				"7": "📦"
			},
			"hopeArmor": "🛡️",
			"hopeGems": "💎",
			"hopeGlory": "🏅",
			"hopeHealthy": "❤️",
			"hopeItem": "📦",
			"hopeMoney": "💰",
			"hopePet": "🐕‍🦺",
			"hopeWeapon": "⚔️",
			"hopeXP": "⭐"
		},
		"66": {
			"end": {
				"0": "😖",
				"1": "😖"
			},
			"hints": "ℹ️",
			"run": "🏝️"
		},
		"67": {
			"accept": "🍺",
			"deny": "✋",
			"end": {
				"0": "🥱"
			}
		},
		"68": {
			"checkDate": "🗓️",
			"end": {
				"0": "🚶‍",
				"1": "👀",
				"2": "📓‍"
			},
			"read": "📖",
			"steal": "📔"
		},
		"69": {
			"accept": "👍",
			"comrpomise": "🤝",
			"deny": "👿",
			"end": {
				"0": "👁️"
			}
		},
		"7": {
			"check": "🚪",
			"end": {
				"0": "🚶"
			},
			"skip": "🚶"
		},
		"70": {
			"end": {
				"0": "💤",
				"1": "🌪️",
				"2": "🏹"
			},
			"explore": "🔍",
			"skip": "🚶"
		},
		"71": {
			"accept": "🍖",
			"deny": "❌",
			"end": {
				"0": "🏃",
				"1": "😠"
			},
			"steal": "💸"
		},
		"72": {
			"end": {
				"0": "🗣️",
				"1": "🧠"
			},
			"joinArchery": "🎯",
			"joinJoust": "🐴",
			"joinMelee": "⚔️",
			"joinPoetry": "📜",
			"searchFood": "🍴"
		},
		"73": {
			"end": {
				"0": "👤",
				"1": "🖌️",
				"2": "💼"
			},
			"goAway": "🚶‍♂️",
			"look": "👀",
			"shame": "🗯"
		},
		"8": {
			"end": {
				"0": "🚶"
			},
			"forest": "🌲",
			"plains": "🏞️"
		},
		"9": {
			"end": {
				"0": "🚶"
			},
			"help": "🔎",
			"skip": "▶️"
		}
	},
	"map_types": {
		"be": "🏖",
		"castle_entrance": "🏰",
		"castle_throne": "🪑",
		"ci": "🏘",
		"continent": "🏞",
		"crystal_cavern": "💎",
		"de": "🏜",
		"fo": "🌳",
		"ice_beach": "🌨",
		"ice_cavern": "🧊",
		"ice_lake": "❄",
		"la": "🚣‍♂",
		"mine": "🪨",
		"mo": "⛰",
		"pl": "🌺",
		"pve_exit": "⛴",
		"ri": "🏞",
		"ro": "🛣",
		"ruins": "🏚",
		"snow_mountain": "🏔",
		"snowmen_field": "☃",
		"test_zone": "👾",
		"tundra": "🌲",
		"vi": "🛖",
		"volcano": "🌋"
	},
	"small_events": {
		"advanceTime": "⌛",
		"bigBad": "😱",
		"boatAdvice": "⛴️",
		"bonusGuildPVEIsland": "😱",
		"botFacts": "💮",
		"botVote": "🗳️",
		"cart": "🚗",
		"class": "🔖",
		"doNothing": "🚶",
		"epicItemShop": "🌟",
		"fightPet": "😾",
		"findItem": "❕",
		"findMission": "📜",
		"findPet": "🐕",
		"findPotion": "⚗️",
		"goToPVEIsland": "⛴️",
		"gobletsGame": "🥛",
		"interactOtherPlayers": "💬",
		"leagueReward": "✨",
		"lottery": "🎰",
		"pet": "🐕‍🦺",
		"shop": "🛒",
		"smallBad": "😖",
		"space": "🪐",
		"staffMember": "📖",
		"ultimateFoodMerchant": "🍲",
		"winEnergy": "⚡",
		"winFightPoints": "🔋",
		"winGuildXP": "⭐",
		"winHealth": "❤️",
		"winPersonalXP": "⭐",
		"witch": "🧹"
	},
	"pets": {
		"0": {
			"emoteFemale": "❌",
			"emoteMale": "❌"
		},
		"1": {
			"emoteFemale": "🐕",
			"emoteMale": "🐕"
		},
		"10": {
			"emoteFemale": "🐔",
			"emoteMale": "🐓"
		},
		"11": {
			"emoteFemale": "🐦",
			"emoteMale": "🐦"
		},
		"12": {
			"emoteFemale": "🦆",
			"emoteMale": "🦆"
		},
		"13": {
			"emoteFemale": "🐎",
			"emoteMale": "🐎"
		},
		"14": {
			"emoteFemale": "🐢",
			"emoteMale": "🐢"
		},
		"15": {
			"emoteFemale": "🐍",
			"emoteMale": "🐍"
		},
		"16": {
			"emoteFemale": "🦎",
			"emoteMale": "🦎"
		},
		"17": {
			"emoteFemale": "🐑",
			"emoteMale": "🐏"
		},
		"18": {
			"emoteFemale": "🐐",
			"emoteMale": "🐐"
		},
		"19": {
			"emoteFemale": "🦃",
			"emoteMale": "🦃"
		},
		"2": {
			"emoteFemale": "🐩",
			"emoteMale": "🐩"
		},
		"20": {
			"emoteFemale": "🦊",
			"emoteMale": "🦊"
		},
		"21": {
			"emoteFemale": "🐻",
			"emoteMale": "🐻"
		},
		"22": {
			"emoteFemale": "🐨",
			"emoteMale": "🐨"
		},
		"23": {
			"emoteFemale": "🐸",
			"emoteMale": "🐸"
		},
		"24": {
			"emoteFemale": "🐒",
			"emoteMale": "🐒"
		},
		"25": {
			"emoteFemale": "🐧",
			"emoteMale": "🐧"
		},
		"26": {
			"emoteFemale": "🦉",
			"emoteMale": "🦉"
		},
		"27": {
			"emoteFemale": "🦇",
			"emoteMale": "🦇"
		},
		"28": {
			"emoteFemale": "🐺",
			"emoteMale": "🐺"
		},
		"29": {
			"emoteFemale": "🐗",
			"emoteMale": "🐗"
		},
		"3": {
			"emoteFemale": "🐈",
			"emoteMale": "🐈"
		},
		"30": {
			"emoteFemale": "🦭",
			"emoteMale": "🦭"
		},
		"31": {
			"emoteFemale": "🦛",
			"emoteMale": "🦛"
		},
		"32": {
			"emoteFemale": "🦙",
			"emoteMale": "🦙"
		},
		"33": {
			"emoteFemale": "🦢",
			"emoteMale": "🦢"
		},
		"34": {
			"emoteFemale": "🦩",
			"emoteMale": "🦩"
		},
		"35": {
			"emoteFemale": "🦝",
			"emoteMale": "🦝"
		},
		"36": {
			"emoteFemale": "🦨",
			"emoteMale": "🦨"
		},
		"37": {
			"emoteFemale": "🦡",
			"emoteMale": "🦡"
		},
		"38": {
			"emoteFemale": "🦫",
			"emoteMale": "🦫"
		},
		"39": {
			"emoteFemale": "🦥",
			"emoteMale": "🦥"
		},
		"4": {
			"emoteFemale": "🐈‍⬛",
			"emoteMale": "🐈‍⬛"
		},
		"40": {
			"emoteFemale": "🐿️",
			"emoteMale": "🐿️"
		},
		"41": {
			"emoteFemale": "🦔️",
			"emoteMale": "🦔"
		},
		"42": {
			"emoteFemale": "🐻‍❄️",
			"emoteMale": "🐻‍❄️"
		},
		"43": {
			"emoteFemale": "🐼",
			"emoteMale": "🐼"
		},
		"44": {
			"emoteFemale": "🦂",
			"emoteMale": "🦂"
		},
		"45": {
			"emoteFemale": "🐊",
			"emoteMale": "🐊"
		},
		"46": {
			"emoteFemale": "🐘",
			"emoteMale": "🐘"
		},
		"47": {
			"emoteFemale": "🦓",
			"emoteMale": "🦓"
		},
		"48": {
			"emoteFemale": "🦏",
			"emoteMale": "🦏"
		},
		"49": {
			"emoteFemale": "🐪",
			"emoteMale": "🐪"
		},
		"5": {
			"emoteFemale": "🐁",
			"emoteMale": "🐁"
		},
		"50": {
			"emoteFemale": "🐫",
			"emoteMale": "🐫"
		},
		"51": {
			"emoteFemale": "🦒",
			"emoteMale": "🦒"
		},
		"52": {
			"emoteFemale": "🦘",
			"emoteMale": "🦘"
		},
		"53": {
			"emoteFemale": "🦚",
			"emoteMale": "🦚"
		},
		"54": {
			"emoteFemale": "🦜",
			"emoteMale": "🦜"
		},
		"55": {
			"emoteFemale": "🦦",
			"emoteMale": "🦦"
		},
		"56": {
			"emoteFemale": "🐅",
			"emoteMale": "🐅"
		},
		"57": {
			"emoteFemale": "🦁",
			"emoteMale": "🦁"
		},
		"58": {
			"emoteFemale": "🦅",
			"emoteMale": "🦅"
		},
		"59": {
			"emoteFemale": "🦤",
			"emoteMale": "🦤"
		},
		"6": {
			"emoteFemale": "🐹",
			"emoteMale": "🐹"
		},
		"60": {
			"emoteFemale": "🐆",
			"emoteMale": "🐆"
		},
		"61": {
			"emoteFemale": "🦣",
			"emoteMale": "🦣"
		},
		"62": {
			"emoteFemale": "🕊️",
			"emoteMale": "🕊️"
		},
		"63": {
			"emoteFemale": "🦄️",
			"emoteMale": "🦄️"
		},
		"64": {
			"emoteFemale": "🐉️",
			"emoteMale": "🐉️"
		},
		"65": {
			"emoteFemale": "🦖️",
			"emoteMale": "🦖️"
		},
		"66": {
			"emoteFemale": "🟣",
			"emoteMale": "🔵"
		},
		"67": {
			"emoteFemale": "⛄",
			"emoteMale": "⛄"
		},
		"68": {
			"emoteFemale": "🦆",
			"emoteMale": "🦆"
		},
		"69": {
			"emoteFemale": "☃️",
			"emoteMale": "☃️"
		},
		"7": {
			"emoteFemale": "🐇",
			"emoteMale": "🐇"
		},
		"70": {
			"emoteFemale": "👽",
			"emoteMale": "👽"
		},
		"71": {
			"emoteFemale": "🐙",
			"emoteMale": "🐙"
		},
		"72": {
			"emoteFemale": "🐧",
			"emoteMale": "🐧"
		},
		"8": {
			"emoteFemale": "🐄",
			"emoteMale": "🐂"
		},
		"9": {
			"emoteFemale": "🐖",
			"emoteMale": "🐖"
		}
	},
	"armors": {
		"0": ":black_large_square:",
		"1": ":eye_in_speech_bubble:",
		"10": ":shield:",
		"11": ":shield:",
		"12": ":shield:",
		"13": ":shield:",
		"14": ":shield:",
		"15": ":shield:",
		"16": ":shield:",
		"17": ":high_brightness:",
		"18": ":martial_arts_uniform:",
		"19": ":safety_vest:",
		"2": ":helmet_with_cross:",
		"20": ":family_mmgb:",
		"21": ":mechanical_arm:",
		"22": ":robot:",
		"23": ":closed_umbrella:",
		"24": ":shield:",
		"25": ":shield:",
		"26": ":rugby_football:",
		"27": ":sparkle:",
		"28": ":shield:",
		"29": ":shield:",
		"3": ":shield:",
		"30": ":shield:",
		"31": ":shield:",
		"32": ":shield:",
		"33": ":shield:",
		"34": ":shield:",
		"35": ":shield:",
		"36": ":shield:",
		"37": ":shield:",
		"38": ":shield:",
		"39": ":military_helmet:",
		"4": ":shield:",
		"40": ":turtle:",
		"41": ":coin:",
		"42": ":military_helmet:",
		"43": ":bucket:",
		"44": ":bricks:",
		"45": ":chess_pawn:",
		"46": ":window:",
		"47": ":japanese_castle:",
		"48": ":coat:",
		"49": ":coat:",
		"5": ":shield:",
		"50": ":lab_coat:",
		"51": ":tent:",
		"52": ":shield:",
		"53": ":shield:",
		"54": ":moyai:",
		"55": ":clown:",
		"56": ":yawning_face:",
		"57": ":feather:",
		"58": ":genie:",
		"59": ":mage:",
		"6": ":fencer:",
		"60": ":bearded_person_tone1:",
		"61": ":sparkles:",
		"7": ":kimono:",
		"8": ":shield:",
		"9": ":shield:"
	},
	"objects": {
		"0": ":black_large_square:",
		"1": ":flag_white:",
		"10": ":mans_shoe:",
		"11": ":angel_tone3:",
		"12": ":new_moon:",
		"13": ":fallen_leaf:",
		"14": ":apple:",
		"15": ":green_apple:",
		"16": ":heartpulse:",
		"17": ":closed_book:",
		"18": ":blue_book:",
		"19": ":orange_book:",
		"2": ":game_die:",
		"20": ":green_book:",
		"21": ":prayer_beads:",
		"22": ":flag_black:",
		"23": ":fleur_de_lis:",
		"24": ":oil:",
		"25": ":candle:",
		"26": ":amphora:",
		"27": ":saxophone:",
		"28": ":guitar:",
		"29": ":credit_card:",
		"3": ":gem:",
		"30": ":mechanical_leg:",
		"31": ":joy_cat:",
		"32": ":spoon:",
		"33": ":jack_o_lantern:",
		"34": ":teddy_bear:",
		"35": ":magnet:",
		"36": ":adhesive_bandage:",
		"37": ":skier:",
		"38": ":cyclone:",
		"39": ":diamond_shape_with_a_dot_inside:",
		"4": ":rosette:",
		"40": ":angel:",
		"41": ":amphora:",
		"42": ":clock230:",
		"43": ":banana:",
		"44": ":apple:",
		"45": ":orange_square:",
		"46": ":stars:",
		"47": ":book:",
		"48": ":movie_camera:",
		"49": ":squeeze_bottle:",
		"5": ":full_moon_with_face:",
		"50": ":hiking_boot:",
		"51": ":broom:",
		"52": ":soap:",
		"53": ":military_medal:",
		"54": ":postal_horn:",
		"55": ":moneybag:",
		"56": ":slot_machine:",
		"57": ":high_heel:",
		"58": ":ringed_planet:",
		"59": ":chocolate_bar:",
		"6": ":crystal_ball:",
		"60": ":office:",
		"61": ":detective:",
		"62": ":eye:",
		"63": ":pick:",
		"64": ":bricks:",
		"65": ":notes:",
		"66": ":globe_with_meridians:",
		"67": ":red_car:",
		"68": ":blue_square:",
		"69": ":headphones:",
		"7": ":chains:",
		"70": ":bed:",
		"71": ":robot:",
		"72": ":sunny:",
		"73": ":roller_coaster:",
		"74": ":hot_pepper:",
		"75": ":electric_plug:",
		"76": ":meat_on_bone:",
		"77": ":health_worker:",
		"78": ":mending_heart:",
		"79": ":dna:",
		"8": ":four_leaf_clover:",
		"80": ":low_battery:",
		"81": ":battery:",
		"82": ":cockroach:",
		"83": ":rocket:",
		"84": ":four_leaf_clover:",
		"85": ":roll_of_paper:",
		"86": ":star2:",
		"87": ":guitar:",
		"88": ":floppy_disk:",
		"9": ":key2:"
	},
	"potions": {
		"0": "⬛",
		"1": "<:Potion:548219908736155658>",
		"10": "<:BubblePurplePotion:548221045266579465>",
		"11": "<:BubblePurplePotion:548221045266579465>",
		"12": "<:DarkPotion:548221047187439710>",
		"13": "<:DarkPotion:548221047187439710>",
		"14": "<:DarkPotion:548221047187439710>",
		"15": "<:DarkPotion:548221047187439710>",
		"16": "<:GreenPotion:548221043618086921>",
		"17": "<:GreenPotion:548221043618086921>",
		"18": "<:PurplePotion:548221048768954418>",
		"19": "<:PurplePotion:548221048768954418>",
		"2": "<:Potion:548219908736155658>",
		"20": "<:PurplePotion:548221048768954418>",
		"21": "<:PurplePotion:548221048768954418>",
		"22": "<:LovePotion:548221051063107594>",
		"23": "<:LovePotion:548221051063107594>",
		"24": "<:LovePotion:548221051063107594>",
		"25": "🍹",
		"26": "🥛",
		"27": "🍼",
		"28": "🍵",
		"29": "☕",
		"3": "<:Potion:548219908736155658>",
		"30": "🥃",
		"31": "🥘",
		"32": "💧",
		"33": "🍷",
		"34": "🐣",
		"35": "⛽",
		"36": "🍵",
		"37": "🥤",
		"38": "🍶",
		"39": "🧉",
		"4": "<:Potion:548219908736155658>",
		"40": "🍾",
		"41": "<:BubbleGreenPotion:548221041940365353>",
		"42": "<:LovePotion:548221051063107594>",
		"43": "🥤",
		"44": "🐺",
		"45": "🌱",
		"46": "🌶",
		"47": "☠",
		"48": "🔋",
		"49": "🥜",
		"5": "<:Potion:548219908736155658>",
		"50": "🍺",
		"51": "🥫",
		"52": "🥫",
		"53": "🥫",
		"54": "🪅",
		"55": "🫕",
		"56": "💩",
		"57": "🩸",
		"58": "🧱",
		"59": "🫧",
		"6": "<:BubbleGreenPotion:548221041940365353>",
		"60": "💦",
		"61": "🚱",
		"62": "🌊",
		"63": "🫙",
		"64": "♻",
		"65": "🫗",
		"66": "🧋",
		"67": "🧃",
		"68": "🧃",
		"69": "🍯",
		"7": "<:BubbleGreenPotion:548221041940365353>",
		"70": "🧅",
		"71": "🗻",
		"72": "⛈",
		"73": "☕",
		"74": "🫗",
		"75": "🌵",
		"76": "🚿",
		"77": "🛵",
		"78": "🧼",
		"79": "🪷",
		"8": "<:BubbleGreenPotion:548221041940365353>",
		"80": "🥶",
		"81": "✒",
		"82": "🛏",
		"83": "🌂",
		"84": "🪶",
		"85": "💉",
		"86": "🍸",
		"87": "🏴‍☠",
		"88": "🐌",
		"89": "♨",
		"9": "<:BubbleGreenPotion:548221041940365353>",
		"90": "🥔",
		"91": "🌊",
		"92": "🧌",
		"93": "🌋"
	},
	"weapons": {
		"0": ":punch:",
		"1": ":zap:",
		"10": ":crossed_swords:",
		"11": ":gun:",
		"12": ":syringe:",
		"13": ":bomb:",
		"14": ":guitar:",
		"15": ":crossed_swords:",
		"16": ":pick:",
		"17": ":wrench:",
		"18": ":wood:",
		"19": ":knife:",
		"2": ":tools:",
		"20": ":herb:",
		"21": ":pick:",
		"22": ":bow_and_arrow:",
		"23": ":cooking:",
		"24": ":scissors:",
		"25": ":dagger:",
		"26": ":field_hockey:",
		"27": ":dagger:",
		"28": ":hammer:",
		"29": ":knife:",
		"3": ":cricket:",
		"30": ":boxing_glove:",
		"31": ":right_facing_fist:",
		"32": ":fishing_pole_and_fish:",
		"33": ":knife:",
		"34": ":fishing_pole_and_fish:",
		"35": ":fishing_pole_and_fish:",
		"36": ":crossed_swords:",
		"37": ":crossed_swords:",
		"38": ":crossed_swords:",
		"39": ":crossed_swords:",
		"4": ":bow_and_arrow:",
		"40": ":crossed_swords:",
		"41": ":crossed_swords:",
		"42": ":gun:",
		"43": ":cucumber:",
		"44": ":bouquet:",
		"45": ":banana:",
		"46": ":bookmark:",
		"47": ":snowflake:",
		"48": ":bow_and_arrow:",
		"49": ":bow_and_arrow:",
		"5": ":hammer:",
		"50": ":bow_and_arrow:",
		"51": ":bow_and_arrow:",
		"52": ":razor:",
		"53": ":chair:",
		"54": ":bricks:",
		"55": ":fork_and_knife:",
		"56": ":dagger:",
		"57": ":fire_extinguisher:",
		"58": ":bookmark:",
		"59": ":syringe:",
		"6": ":knife:",
		"60": ":syringe:",
		"61": ":syringe:",
		"62": ":microbe:",
		"63": ":bomb:",
		"64": ":candle:",
		"65": ":chopsticks:",
		"66": ":crossed_swords:",
		"67": ":crossed_swords:",
		"68": ":left_fist:",
		"69": ":crossed_swords:",
		"7": ":dagger:",
		"70": ":gun:",
		"71": ":crossed_swords:",
		"72": ":soccer:",
		"73": ":axe:",
		"74": ":comet:",
		"75": ":boomerang:",
		"76": ":zap:",
		"77": ":diving_mask:",
		"78": ":people_hugging:",
		"79": ":closed_umbrella:",
		"8": ":pushpin:",
		"80": ":fireworks:",
		"81": ":dagger:",
		"82": ":feet:",
		"83": ":face_with_symbols_over_mouth:",
		"84": ":screwdriver:",
		"85": ":heart:",
		"86": ":performing_arts:",
		"87": ":warning:",
		"88": ":feather:",
		"89": ":dragon:",
		"9": ":wrench:",
		"90": ":unicorn:",
		"91": ":lollipop:",
		"92": ":video_game:",
		"93": ":fork_and_knife:",
		"94": ":skull:"
	},
	"classes": {
		"0": "🌿",
		"1": "🪓",
		"10": "🏹",
		"11": "🔫",
		"12": "🧹",
		"13": "🏇",
		"14": "🦯",
		"15": "🤺",
		"16": "⚜",
		"17": "🔱",
		"18": "⚔",
		"19": "🛡",
		"2": "🗡",
		"20": "🔫",
		"21": "🤺",
		"22": "⚜",
		"23": "🔱",
		"24": "🧙",
		"3": "⚔",
		"4": "🥊",
		"5": "🪖",
		"6": "⛓",
		"7": "🛡",
		"8": "🪨",
		"9": "🦾"
	},
	"witch_small_event": {
		"bat": "🦇",
		"beer": "🍺",
		"bigWait": "🕙",
		"bigWarm": "🔥",
		"blood": "🩸",
		"bone": "🦴",
		"book": "📖",
		"cobweb": "🕸️",
		"chicken": "🐔",
		"cool": "❄️",
		"crystalBall": "🔮",
		"distiller": "⚗️",
		"eye": "👁️",
		"frog": "🐸",
		"greenApple": "🍏",
		"heart": "🫀",
		"mushroom": "🍄",
		"nothing": "🤷",
		"package": "📦",
		"rat": "🐀",
		"redApple": "🍎",
		"rose": "🌹",
		"scorpion": "🦂",
		"smallWait": "⏳",
		"smallWarm": "🌡️",
		"snake": "🐍",
		"spider": "🕷️",
		"stir": "🥄",
		"teeth": "🦷",
		"testTube": "🧪",
		"turtle": "🐢",
		"wand": "🪄",
		"wiltedRose": "🥀",
		"worm": "🪱"
	},

	"cart_small_event": {
		"accept": "🚗",
		"refuse": "🚶"
	},
	"fight_command": {
		"accept": "🔍",
		"refuse": "❌",
		"crossed_swords": "⚔️"
	},
	"foods": {
		"herbivorousFood": "🥬",
		"commonFood": "🍬",
		"carnivorousFood": "🍖",
		"ultimateFood": "🍲"
	},
	"collectors": {
		"accept": "✅",
		"refuse": "❌",
		"lottery": {
			"easy": "🪙",
			"medium": "💵",
			"hard": "💰"
		},
		"interactPoorCoin": "🪙",
		"warning": "⚠️",
		"question": "❓"
	},
	"fight_actions": {
		"benediction": "👼",
		"boomerangAttack": "🪃",
		"breathTakingAttack": "💨",
		"canonAttack": "🔫",
		"chargeChargingAttack": "🧲",
		"chargeUltimateAttack": "☄️",
		"chargingAttack": "🧲",
		"concentration": "🎯",
		"counterAttack": "🥊",
		"cursedAttack": "😈",
		"darkAttack": "✴️",
		"defenseBuff": "🧘",
		"divineAttack": "🙏",
		"energeticAttack": "⚡",
		"fireAttack": "🔥",
		"heavyAttack": "🔨",
		"intenseAttack": "😤",
		"piercingAttack": "🪡",
		"poisonousAttack": "🧪",
		"powerfulAttack": "🪓",
		"protection": "🙅",
		"quickAttack": "🗡️",
		"ramAttack": "🐏",
		"resting": "🛏️",
		"sabotageAttack": "🛠️",
		"shieldAttack": "🛡️",
		"simpleAttack": "⚔️",
		"ultimateAttack": "☄️"
	},
	"class_kinds": {
		"basic": "⚖️",
		"attack": "🗡️",
		"defense": "🛡️",
		"other": "⚗️"
	},
	"announcements": {
		"trophy": "🏆"
	},
	"commands": {
		"respawn": "👼"
	},
	"unitValues": {
		"score": "🏅",
		"money": "💰",
		"lostMoney": "💸",
		"xp": "⭐",
		"gem": "💎",
		"guildPoint": "🪩",
		"health": "❤️",
		"lostHealth": "💔",
		"energy": "⚡",
		"rage": "💢",
		"time": "🕜",
		"attack": "🗡️",
		"defense": "🛡️",
		"speed": "🚀",
		"breath": "🌬️",
		"breathRegen": "🫁",
		"petRarity": "⭐",
		"glory": "✨"
	},
	"shopItems": {
		"randomItem": "❓",
		"healAlteration": "🏥",
		"healEnergy": "⚡",
		"regen": "💓",
		"moneyMouthBadge": "🤑",
		"inventoryExtension": "📦",
		"smallGuildXp": "⭐",
		"bigGuildXp": "🌟",
		"skipMission": "🧾",
		"lovePointsValue": "🧑‍⚕️",
		"treasure": "👑"
	},
	"badges": {
		"richPerson": "🤑",
		"guildBadge": "💎",
		"superGuildBadge": "🪩",
		"questMasterBadge": "💍"
	},
	"itemKinds": [
		"⚔️",
		"🛡️",
		"⚗️",
		"🧸"
	],
	"notifications": {
		"bell": "🔔",
		"sendLocation": "📩",
		"back": "↩️",
		"types": {
			"report": "📰",
			"guildDaily": "🏟️"
		}
	},
	"missions": {
		"expired": "📤",
		"daily": "📅",
		"campaign": "📖",
		"sideMission": "📜",
		"total": "🧾"
	},
	"messages": {
		"validate": "✅",
		"refuse": "❌",
		"notReplied": "🔚"
	},
	"fightPetActions": {
		"fistHit": "👊",
		"runAway": "🏃",
		"focusEnergy": "⚡",
		"intimidate": "💪",
		"baitWithMeat": "🍖",
		"provoke": "😤",
		"baitWithVegetables": "🥕",
		"doNothing": "🤷",
		"lastEffort": "🔥",
		"protect": "🛡️",
		"usePlayerPet": "🐾",
		"playDead": "💀",
		"scream": "😱",
		"prayGod": "🙏",
		"attackLeft": "🤛",
		"attackRight": "🤜",
		"helpFromMates": "🏟️"
	},
	"rewards": {
		"item": "🎁",
		"partialHeal": "💟"
	},
	"goblets": {
		"metal": "🐲",
		"biggest": "🪣",
		"sparkling": "✨"
	},
	"sex": {
		"male": "♂️",
		"female": "♀️"
	},
	"diet": {
		"omnivorous": "🥪",
		"herbivorous": "🥬",
		"carnivorous": "🥩"
	},
	"petInformation": {
		"loveScore": "💖",
		"diet": "🍽️",
		"nextFeed": "🕙"
	},
	"leagues": {
		"0": "🌲",
		"1": "🗿",
		"2": "⚔️",
		"3": "🥉",
		"4": "🥈",
		"5": "🥇",
		"6": "💎",
		"7": "💯",
		"8": "🌀",
		"9": "🏆"
	},
	"top": {
		"badges": {
			"first": "🥇",
			"second": "🥈",
			"third": "🥉",
			"fourth": "🏅",
			"fifth": "🏅",
			"self": "🔵",
			"sameContext": "⚪",
			"default": "⚫"
		},
		"afk": "👻",
		"allTime": "🗓️️",
		"weekly": "🕤",
		"congrats": "🏆",
		"error": "❌",
		"guild": "🏟️"
	}
};