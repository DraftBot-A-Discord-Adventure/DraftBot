export class Constants {
	static readonly VERSION = import("../../../Discord/package.json").then(json => json.version);

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

	static readonly CACHE_TIME = {
		INTERACTIONS: 900000
	};

	static readonly PROFILE = {
		DISPLAY_ALL_BADGE_EMOTE: "🎖️",
		MAX_EMOTE_DISPLAY_NUMBER: 10
	};

	static readonly DEFAULT_HEALED_EFFECT = ":hospital:";
}