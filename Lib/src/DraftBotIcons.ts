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
	monsters: {
		[monsterId: string]: string
	}
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
		crossed_swords: string,
		clipboard: string,
		handshake: string,
		ai_thinking: string
	},
	pve_fights: {
		wait_a_bit: string,
		start_fight: string,
	}
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
		question: string,
		back: string
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
	},
	petTransfer: {
		deposit: string,
		switch: string,
		withdraw: string
	},
	leagueReward: {
		[leagueRewardId: string]: string
	}
	other: {
		[otherId: string]: string
	}

	guild: {
		chief: string,
		elder: string,
		member: string,
		isOnPveIsland: string,
		isOnBoat: string,
		countAsAnAlly: string,
		cannotBeJoinedOnBoat: string
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
		"74": {
			"end": {
				"0": "🐟"
			},
			"eat": "🍽️",
			"run": "🏃",
			"smell": "👃"
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
		"winEnergyOnIsland": "🔋",
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
		"73": {
			"emoteFemale": "🐟",
			"emoteMale": "🐟"
		},
		"74": {
			"emoteFemale": "🐠",
			"emoteMale": "🐠"
		},
		"75": {
			"emoteFemale": "🐡",
			"emoteMale": "🐡"
		},
		"76": {
			"emoteFemale": "🪼",
			"emoteMale": "🪼"
		},
		"77": {
			"emoteFemale": "🦈",
			"emoteMale": "🦈"
		},
		"78": {
			"emoteFemale": "🐋",
			"emoteMale": "🐋"
		},
		"79": {
			"emoteFemale": "🐳",
			"emoteMale": "🐳"
		},
		"8": {
			"emoteFemale": "🐄",
			"emoteMale": "🐂"
		},
		"80": {
			"emoteFemale": "🦐",
			"emoteMale": "🦐"
		},
		"81": {
			"emoteFemale": "🦞",
			"emoteMale": "🦞"
		},
		"82": {
			"emoteFemale": "🐬",
			"emoteMale": "🐬"
		},
		"9": {
			"emoteFemale": "🐖",
			"emoteMale": "🐖"
		}
	},
	"monsters": {
		"spider": "🕷️",
		"slimyMutant": "🦠",
		"skeleton": "💀",
		"rockGolem": "🗿",
		"magmaTitan": "🌋",
		"forestTroll": "🧌"
	},
	"armors": {
		"0": "⬛",
		"1": "👁️",
		"10": "🛡️",
		"11": "🛡️",
		"12": "🛡️",
		"13": "🛡️",
		"14": "🛡️",
		"15": "🛡️",
		"16": "🛡️",
		"17": "🔆",
		"18": "🥋",
		"19": "🦺",
		"2": "⛑️",
		"20": "👨‍👩‍👧‍👦",
		"21": "🦾",
		"22": "🤖",
		"23": "🌂",
		"24": "🛡️",
		"25": "🛡️",
		"26": "🏉",
		"27": "✨",
		"28": "🛡️",
		"29": "🛡️",
		"3": "🛡️",
		"30": "🛡️",
		"31": "🛡️",
		"32": "🛡️",
		"33": "🛡️",
		"34": "🛡️",
		"35": "🛡️",
		"36": "🛡️",
		"37": "🛡️",
		"38": "🛡️",
		"39": "🪖",
		"4": "🛡️",
		"40": "🐢",
		"41": "🪙",
		"42": "🪖",
		"43": "🪣",
		"44": "🧱",
		"45": "♟️",
		"46": "🪟",
		"47": "🏯",
		"48": "🧥",
		"49": "🧥",
		"5": "🛡️",
		"50": "🥼",
		"51": "⛺",
		"52": "🛡️",
		"53": "🛡️",
		"54": "🗿",
		"55": "🤡",
		"56": "🥱",
		"57": "🪶",
		"58": "🧞",
		"59": "🧙",
		"6": "🤺",
		"60": "🧔🏻",
		"61": "✨",
		"7": "👘",
		"8": "🛡️",
		"9": "🛡️"
	},
	"objects": {
		"0": "⬛",
		"1": "🏳️",
		"10": "👞",
		"11": "👼🏽",
		"12": "🌑",
		"13": "🍂",
		"14": "🍎",
		"15": "🍏",
		"16": "💗",
		"17": "📕",
		"18": "📘",
		"19": "📙",
		"2": "🎲",
		"20": "📗",
		"21": "📿",
		"22": "🏴",
		"23": "⚜️",
		"24": "🛢️",
		"25": "🕯️",
		"26": "🏺",
		"27": "🎷",
		"28": "🎸",
		"29": "💳",
		"3": "💎",
		"30": "🦿",
		"31": "😹",
		"32": "🥄",
		"33": "🎃",
		"34": "🧸",
		"35": "🧲",
		"36": "🩹",
		"37": "⛷️",
		"38": "🌀",
		"39": "💠",
		"4": "🏵️",
		"40": "👼",
		"41": "🏺",
		"42": "🕝",
		"43": "🍌",
		"44": "🍎",
		"45": "🟧",
		"46": "🌟",
		"47": "📖",
		"48": "🎥",
		"49": "🧴",
		"5": "🌝",
		"50": "🥾",
		"51": "🧹",
		"52": "🧼",
		"53": "🎖️",
		"54": "📯",
		"55": "💰",
		"56": "🎰",
		"57": "👠",
		"58": "🪐",
		"59": "🍫",
		"6": "🔮",
		"60": "🏢",
		"61": "🕵️",
		"62": "👁️",
		"63": "⛏️",
		"64": "🧱",
		"65": "🎶",
		"66": "🌐",
		"67": "🚗",
		"68": "🟦",
		"69": "🎧",
		"7": "⛓️",
		"70": "🛏️",
		"71": "🤖",
		"72": "☀️",
		"73": "🎢",
		"74": "🌶️",
		"75": "🔌",
		"76": "🍖",
		"77": "🧑‍⚕️",
		"78": "❤️‍🩹",
		"79": "🧬",
		"8": "🍀",
		"80": "🔋",
		"81": "🔋",
		"82": "🪳",
		"83": "🚀",
		"84": "🍀",
		"85": "🧻",
		"86": "🌟",
		"87": "🎸",
		"88": "💾",
		"89": "🐟",
		"9": "🗝️"
	},
	"potions": {
		"0": "⬛",
		"1": "🍷",
		"10": "🍇",
		"11": "🍇",
		"12": "⚗️",
		"13": "⚗️",
		"14": "⚗️",
		"15": "⚗️",
		"16": "🧃",
		"17": "🧃",
		"18": "🍸",
		"19": "🍸",
		"2": "🍷",
		"20": "🍸",
		"21": "🍸",
		"22": "❤️",
		"23": "❤️",
		"24": "❤️",
		"25": "🍹",
		"26": "🥛",
		"27": "🍼",
		"28": "🍵",
		"29": "☕",
		"3": "🍷",
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
		"4": "🍷",
		"40": "🍾",
		"41": "🧪",
		"42": "❤️",
		"43": "🥤",
		"44": "🐺",
		"45": "🌱",
		"46": "🌶",
		"47": "☠",
		"48": "🔋",
		"49": "🥜",
		"5": "🍷",
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
		"6": "🧪",
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
		"7": "🧪",
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
		"8": "🧪",
		"80": "🥶",
		"81": "✒",
		"82": "🛏",
		"83": "🌂",
		"84": "🪶",
		"85": "💉",
		"86": "🍸",
		"87": "🏴‍☠️",
		"88": "🐌",
		"89": "♨",
		"9": "🧪",
		"90": "🥔",
		"91": "🌊",
		"92": "🧌",
		"93": "🌋"
	},
	"weapons": {
		"0": "👊",
		"1": "⚡",
		"10": "⚔️",
		"11": "🔫",
		"12": "💉",
		"13": "💣",
		"14": "🎸",
		"15": "⚔️",
		"16": "⛏️",
		"17": "🔧",
		"18": "🪵",
		"19": "🔪",
		"2": "🛠️",
		"20": "🌿",
		"21": "⛏️",
		"22": "🏹",
		"23": "🍳",
		"24": "✂️",
		"25": "🗡️",
		"26": "🏑",
		"27": "🗡️",
		"28": "🔨",
		"29": "🔪",
		"3": "🏏",
		"30": "🥊",
		"31": "🤜",
		"32": "🎣",
		"33": "🔪",
		"34": "🎣",
		"35": "🎣",
		"36": "⚔️",
		"37": "⚔️",
		"38": "⚔️",
		"39": "⚔️",
		"4": "🏹",
		"40": "⚔️",
		"41": "⚔️",
		"42": "🔫",
		"43": "🥒",
		"44": "💐",
		"45": "🍌",
		"46": "🔖",
		"47": "❄️",
		"48": "🏹",
		"49": "🏹",
		"5": "🔨",
		"50": "🏹",
		"51": "🏹",
		"52": "🪒",
		"53": "🪑",
		"54": "🧱",
		"55": "🍴",
		"56": "🗡️",
		"57": "🧯",
		"58": "🔖",
		"59": "💉",
		"6": "🔪",
		"60": "💉",
		"61": "💉",
		"62": "🦠",
		"63": "💣",
		"64": "🕯️",
		"65": "🥢",
		"66": "⚔️",
		"67": "⚔️",
		"68": "🤛",
		"69": "⚔️",
		"7": "🗡️",
		"70": "🔫",
		"71": "⚔️",
		"72": "⚽",
		"73": "🪓",
		"74": "☄️",
		"75": "🪃",
		"76": "⚡",
		"77": "🤿",
		"78": "🫂",
		"79": "🌂",
		"8": "📌",
		"80": "🎆",
		"81": "🗡️",
		"82": "🦶",
		"83": "🤬",
		"84": "🪛",
		"85": "❤️",
		"86": "🎭",
		"87": "⚠️",
		"88": "🪶",
		"89": "🐉",
		"9": "🔧",
		"90": "🦄",
		"91": "🍭",
		"92": "🎮",
		"93": "🍴",
		"94": "💀"
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
		"16": "⚜️",
		"17": "🔱",
		"18": "⚔️",
		"19": "🛡️",
		"2": "🗡️",
		"20": "🔫",
		"21": "🤺",
		"22": "⚜️",
		"23": "🔱",
		"24": "🧙",
		"3": "⚔️",
		"4": "🥊",
		"5": "🪖",
		"6": "⛓️",
		"7": "🛡️",
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
		"crossed_swords": "⚔️",
		"clipboard": "📋",
		"handshake": "🤝",
		"ai_thinking": "🧠"
	},
	"pve_fights": {
		"wait_a_bit": "⏳",
		"start_fight": "⚔️"
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
		"question": "❓",
		"back": "↩️"
	},
	"fight_actions": {
		"benediction": "👼",
		"blind": "🫣",
		"boomerangAttack": "🪃",
		"breathTakingAttack": "💨",
		"burned": "🥵",
		"canonAttack": "🔫",
		"chargeChargingAttack": "🧲",
		"chargeUltimateAttack": "☄️",
		"chargingAttack": "🧲",
		"concentrated": "🎯",
		"concentration": "🎯",
		"confused": "🤯",
		"swallowed": "👄",
		"dirty": "🗑️",
		"getDirty": "💩",
		"counterAttack": "🥊",
		"cursed": "👻",
		"cursedAttack": "😈",
		"darkAttack": "✴️",
		"defenseBuff": "🧘",
		"divineAttack": "🙏",
		"energeticAttack": "⚡",
		"fireAttack": "🔥",
		"frozen": "🥶",
		"full": "😴",
		"heavyAttack": "🔨",
		"intenseAttack": "😤",
		"none": "🚫",
		"outOfBreath": "😮‍💨",
		"outRage": "💢",
		"paralyzed": "🚷",
		"petrified": "🗿",
		"piercingAttack": "🪡",
		"poisoned": "🤢",
		"poisonousAttack": "🧪",
		"powerfulAttack": "🪓",
		"protected": "💞",
		"protection": "🙅",
		"quickAttack": "🗡️",
		"ramAttack": "🐏",
		"resting": "🛏️",
		"sabotageAttack": "🛠️",
		"shieldAttack": "🛡️",
		"simpleAttack": "⚔️",
		"slowed": "🦥",
		"stunned": "😖",
		"targeted": "↩️",
		"ultimateAttack": "☄️",
		"weak": "🤧"
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
		"respawn": "👼",
		"classes": "📑",
		"classesDescription": "📜"
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
		"total": "🧾",
		"book": "📖"
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
	},
	"petTransfer": {
		"deposit": "📥",
		"switch": "🔄",
		"withdraw": "📤"
	},
	"leagueReward": {
		"compression": "🗜️"
	},
	"other": {
		"trash": "🗑️",
		"tada": "🎉",
		"guild": "🏟️",
		"island": "🏝️",
		"increase": "🔼"
	},
	"guild": {
		"chief": "👑",
		"elder": "🎖️",
		"member": "⚫",
		"isOnPveIsland": "🏝️",
		"isOnBoat": "⛴️",
		"countAsAnAlly": "🤝",
		"cannotBeJoinedOnBoat": "👻"
	}
};