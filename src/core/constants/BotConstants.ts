export abstract class BotConstants {
	static readonly ACTIVITY = "🌍 - Draftbot.com !";

	static readonly START_STATUS = ":robot: **DraftBot** - v{version} - Shard {shardId}";

	static readonly DM = {
		SUPPORT_ALERT: ":love_letter: | **Nouveau message privé reçu !** \n`Auteur: {username} {alertIcon}(id : {id})`\n\n>>> ",
		TITLE_SUPPORT: "{pseudo}, welcome to the DraftBot Assistance Program.",
		MESSAGE_SUPPORT: ":flag_gb: If you want to receive help, select your language using reactions below. If you don't need help, please ignore this message.\n:warning: **Every message sent here can be read by human!**\n\n:flag_fr: Si vous avez besoin d'aide, sélectionnez votre langue en utilisant les réactions ci-dessous. Si vous n'avez pas besoin d'aide, ignorez ce message.\n:warning: **Chaque message envoyé ici peut être lu par un humain !**",
		ALERT_ICON: "\uD83D\uDD15 ",
		INTERACTION_SUPPORT: ":flag_gb: Hello, commands are disabled in private messages. Please go on a server to play!\n\n:flag_fr: Bonjour, les commandes sont désactivées en messages privés. Merci d'aller sur un serveur pour jouer !"
	};

	static readonly GUILD_JOIN = {
		BEGIN_QUIT: "**:outbox_tray: Serveur discord quitté :** `",
		BEGIN_JOIN: "**:inbox_tray: Serveur discord rejoint :** `",
		PERSONS: "` | :bust_in_silhouette: : `",
		RATIO: "` | Ratio bot/Humain : `",
		BOTS: "` | :robot: : `",
		VALIDATION: "` % | Validation : "
	};

	static readonly DEPARTURE_MESSAGE = ":flag_fr: Bonjour !\n\nVous recevez ce message car je ne peux pas rester sur votre serveur.\n\nMalheureusement votre serveur ne remplit pas certaines des conditions d'utilisation du bot qui ont été mises en place pour maintenir un minimum de confort aux joueurs en garantissant des performances normales. Pour plus de détails sur ces limitations, consultez https://draftbot.fandom.com/fr/wiki/Restrictions.\n\nSi vous avez des questions sur le fonctionnement du bot ou si vous souhaiter contester ce départ je vous invite à visiter le site internet : https://discord.gg/5JqrMtZ où vous pourrez trouver un lien vers le discord de support du bot !\n\nCordialement - DraftBot\n\n\n:flag_gb: Hello!\n\nYou received this message because I can't stay on your server.\n\nUnfortunately, your server doesn't fulfill some of the bot's requirements. These requirements are put in place to guarantee normal performance. For more details on these limitations, see https://draftbot.fandom.com/en/wiki/Restrictions\n\nIf you have questions about how the bot works, or if you want to discuss this, visit https://discord.gg/5JqrMtZ where you can find a link to the bot's support Discord!\n\nSincerely - DraftBot";

	static readonly NEW_VOTE = "{descStart}` and got the badge {voteBadge} for `{badgeDuration} hours` :tada:\n\nYou can vote [here]({voteUrl}) every 12 hours!\n||User ID: {userId}||";

	static readonly VERSION = import("../../../package.json").then(json => json.version);
}