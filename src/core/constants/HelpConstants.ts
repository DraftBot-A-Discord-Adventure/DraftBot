export abstract class HelpConstants {
	static readonly ACCEPTED_SEARCH_WORDS = {
		PREFIX: ["prefix", "prefixe", "préfixe", "préfix", "changePrefix", "changePréfix", "changePrefixe", "changePréfixe"],
		PING: ["ping", "mention", "uptime", "shard"],
		RESPAWN: ["respawn", "rp", "ressusciter", "revivre", "rv", "reset", "revivre"],
		PROFILE: ["profile", "profil", "p", "me", "info"],
		SWITCH: ["switch", "sw", "échanger", "echanger", "échange", "echange", "intervertir"],
		FIGHT: ["fight", "f", "combat", "duel"],
		LANGUAGE: ["language", "langage", "langue", "l", "speak"],
		TOP: ["top", "classement", "t", "points"],
		HELP: ["help", "h", "aide", "a"],
		INVENTORY: ["inventory", "inv", "i", "inventaire"],
		REPORT: ["report", "r", "rapport", "raport", "repport", "adventure", "play", "aventure", "advance", "avancer", "rapor", "repor", "rep", "game", "jouer"],
		SELL: ["sell", "vendre"],
		DAILY_BONUS: ["daily", "da", "récompensejournalière", "rj", "journaliere", "journalière", "recompensejournaliere",
			"recompense", "journalier", "journalièr", "bonus", "db", "bonusjournalier", "dailybonus", "bonusdaily"],
		INVITE_DRAFTBOT: ["invite", "addbot", "inviter", "ajouter", "ajouterbot", "invitedraftbot", "adddraftbot", "invitdraftbot"],
		BADGES: ["badges", "badge"],
		DRINK: ["drink", "dr", "glouglou", "boire", "boir", "br"],
		SHOP: ["shop", "s", "magasin", "m", "buy"],
		GUILD_CREATE: ["guildcreate", "gcreate", "gc", "créerguilde", "createguilde", "creerguilde", "guildecreer", "cg", "newguilde"],
		GUILD_LEAVE: ["guildleave", "gleave", "gl", "quitter", "quitterguilde", "guildequitter", "leaveguilde",
			"leaveguild", "quitterguild", "guildquitter", "quitguilde", "quitguild", "guildequit", "guildquit"],
		GUILD: ["guild", "guilde", "infoguilde", "infosguilde", "myguilde", "maguilde", "g"],
		GUILD_DAILY_BONUS: ["guilddaily", "gdaily", "gd", "récompensedeguilde", "récompenseguilde", "récompensedeguild",
			"récompenseguild", "recompensedeguilde", "recompenseguilde", "recompensedeguild", "recompenseguild", "dailyguild", "dailyguilde",
			"guilddailybonus", "gdb", "guildailybonus", "gdbonus", "guilddailybon", "gdbon"],
		GUILD_KICK: ["guildkick", "gkick", "gk", "expulser", "expulsion", "kick", "kickguild", "kickguilde", "expulserguilde", "expulsermembre", "virer", "eg"],
		GUILD_INVITE: ["guildadd", "gadd", "ga", "ajouter", "ajout", "add", "addguild", "addguilde", "ajouterguilde",
			"ajoutermembre", "invitemember", "ag", "guildinvite", "guildi", "invitationguilde", "invitationguild"],
		GUILD_DESCRIPTION: ["guilddescription", "gdesc", "guilddesc", "guildedescription", "descriptionguild", "guildescription", "guildesc"],
		GUILD_ELDER: ["guildelder", "gelder", "aine", "promotion", "aîne", "promouvoir", "guildeelder", "elderguilde", "elderguild"],
		GUILD_ELDER_REMOVE: ["guildelderremove", "gelderremove", "ger", "dégrader", "degrader", "dégrade", "degrade",
			"enleveraine", "enleveraîne", "enleverainedeguilde", "enleveraînedeguilde", "enleveraineguilde", "enleveraîneguilde",
			"enleveraineguild", "enleveraîneguild", "enleverainedeguild", "enleveraînedeguild", "removeelder", "guildeerlderremove", "geldeerremove"],
		GUILD_STORAGE: ["guildstorage", "gstorage", "gst", "stockage", "gstockage", "greserve", "stockagedeguilde",
			"guildestockage", "guildestorage", "guildstockage", "guildereserve", "entrepotguild", "entrepotguilde", "entrepotdeguild", "entrepotdeguild", "entrepot"],
		GUILD_SHOP: ["guildshop", "guildeshop", "gs", "magasindeguilde", "magasindeguild", "guildemagasin", "guildmagasin"],
		UPDATE: ["update", "changelog", "miseajour", "miseàjour", "nouveautés", "nouveautes"],
		CLASSES: ["class", "c", "classes", "classe"],
		PET: ["pet", "mypet", "p", "familier", "monfamilier", "monpet", "animal"],
		PET_TRANSFER: ["pettransfer", "pettr", "ptr", "ptransfer", "pettransfert", "familiertransfert", "ft", "ftransfert", "ftransfer"],
		PET_NICKNAME: ["petnickname", "petnick", "pnickname", "pnick", "petname", "pname"],
		PET_FREE: ["petfree", "petf", "pfree", "freepet", "freep", "liberer", "libererpet", "libererfamilier",
			"libereranimal", "delivrer", "delivrerpet", "delivrerfamilier", "delivreranimal", "libérer", "libérerpet",
			"libérerfamilier", "libéreranimal", "délivrer", "délivrerpet", "délivrerfamilier", "délivreranimal"],
		GUILD_SHELTER: ["guildshelter", "shelter", "pets", "animals", "gshelter", "gpets", "ganimals", "guildpets", "guildanimals",
			"guildanimale", "guildanimal", "sh", "abris", "aubergeanimal", "familiers", "guildeshelter", "abrideguilde",
			"abriguilde", "abrideguild", "abriguild", "abrisdeguilde", "abrisguilde", "abrisdeguild", "abrisguild"],
		PET_TRADE: ["pettrade", "ptrade", "echangepet", "familiertrade", "fechange", "echangeanimal", "echangeanimale"],
		PET_FEED: ["petfeed", "feed", "pf", "pfeed", "feedp", "feedpet", "fp"],
		PET_SELL: ["petsell", "psell", "vendrepet", "ventepet", "vendreanimal", "venteaniaml", "vendreanimale", "venteanimale", "vendreanimales", "venteanimales", "venteanimaux", "vendreanimaux"],
		CLASSES_INFO: ["classinfo", "classInfo", "cs", "classesstats", "classcompare", "classestats", "classtats", "classstat", "statistiquesclass",
			"statistiquesclasse", "statistiquesclasses", "statistiqueclass", "statistiqueclasse", "statistiqueclasses",
			"classstatistiques", "classestatistiques", "classesstatistiques", "classstatistique", "classestatistique", "classesstatistique",
			"classinfos", "classinfosstats", "classesinfo", "classesinfo"],
		RARITY: ["rarity", "rarities", "rareté", "rarete", "rare"],
		VOTE: ["vote", "ilovedraftbot", "votes", "voté", "voter", "votés"],
		IDEA: ["idea", "ideas", "suggestions", "suggestion", "suggest", "idée", "idé", "idées", "idés", "idee", "ide", "idees", "ides"],
		DM_NOTIFICATIONS: ["dmnotifications", "dmn", "notificationsmp", "notificationsprivées", "notificationsmps", "notificationmp",
			"notifs", "dms", "notif", "dmnotification", "mp", "mpdésac", "mpdesac", "mpdésacactivé", "mpdesactive", "mpdésacactiver", "mpdésacactive"],
		UNLOCK: ["unlock", "bail", "release", "libérer", "liberer", "libére", "libere", "libéreration", "libereration", "jail", "prison"],
		MAP: ["map", "world", "monde", "carte"],
		MISSIONS: ["missions", "m", "mission", "quests", "quest", "q", "quête", "quete", "quêtes", "quetes"],
		MISSIONS_SHOP: ["missionshop", "ms", "mshop", "questshop", "missionsshop", "questsshop", "qs", "shopmissions",
			"shopmission", "magasindemissions", "magasindemission", "missionmagasin", "missionsmagasin", "magasinmissions", "magasinmission"]
	};

	static readonly COMMANDS_DATA = {
		PREFIX: {
			EMOTE: ":interrobang:",
			CATEGORY: "server"
		},
		PING:
			{
				EMOTE: ":ping_pong:",
				CATEGORY: "util"
			},
		RESPAWN:
			{
				EMOTE: ":angel:",
				CATEGORY: "player"
			},
		PROFILE:
			{
				EMOTE: ":bust_in_silhouette:",
				CATEGORY: "player"
			},
		SWITCH:
			{
				EMOTE: ":repeat:",
				CATEGORY: "player"
			},
		FIGHT:
			{
				EMOTE: ":crossed_swords:",
				CATEGORY: "player"
			},
		HELP:
			{
				EMOTE: ":notebook_with_decorative_cover:",
				CATEGORY: "util"
			},
		LANGUAGE:
			{
				EMOTE: ":flag_gb:",
				CATEGORY: "server"
			},
		TOP:
			{
				EMOTE: ":trophy:",
				CATEGORY: "player"
			},
		INVENTORY:
			{
				EMOTE: ":school_satchel:",
				CATEGORY: "player"
			},
		REPORT:
			{
				EMOTE: ":newspaper:",
				CATEGORY: "player"
			},
		SELL:
			{
				EMOTE: ":moneybag:",
				CATEGORY: "player"
			},
		DAILY_BONUS:
			{
				EMOTE: ":calendar:",
				CATEGORY: "player"
			},
		INVITE_DRAFTBOT:
			{
				EMOTE: ":inbox_tray:",
				CATEGORY: "util"
			},
		BADGES:
			{
				EMOTE: ":military_medal:",
				CATEGORY: "util"
			},
		DRINK:
			{
				EMOTE: ":tropical_drink:",
				CATEGORY: "player"
			},
		SHOP:
			{
				EMOTE: ":shopping_cart:",
				CATEGORY: "player"
			},
		GUILD_CREATE:
			{
				EMOTE: ":pencil:",
				CATEGORY: "guild"
			},
		GUILD_LEAVE:
			{
				EMOTE: ":outbox_tray:",
				CATEGORY: "guild"
			},
		GUILD:
			{
				EMOTE: ":stadium:",
				CATEGORY: "guild"
			},
		GUILD_DAILY_BONUS:
			{
				EMOTE: ":newspaper:",
				CATEGORY: "guild"
			},
		GUILD_KICK:
			{
				EMOTE: ":leg:",
				CATEGORY: "guild"
			},
		GUILD_INVITE:
			{
				EMOTE: ":incoming_envelope:",
				CATEGORY: "guild"
			},
		GUILD_DESCRIPTION:
			{
				EMOTE: ":writing_hand:",
				CATEGORY: "guild"
			},
		GUILD_ELDER:
			{
				EMOTE: ":military_medal:",
				CATEGORY: "guild"
			},
		GUILD_ELDER_REMOVE:
			{
				EMOTE: ":outbox_tray:",
				CATEGORY: "guild"
			},
		GUILD_STORAGE:
			{
				EMOTE: ":pencil:",
				CATEGORY: "guild"
			},
		GUILD_SHOP:
			{
				EMOTE: ":shopping_cart:",
				CATEGORY: "guild"
			},
		UPDATE:
			{
				EMOTE: ":scroll:",
				CATEGORY: "util"
			},
		CLASSES:
			{
				EMOTE: ":bookmark:",
				CATEGORY: "player"
			},
		PET:
			{
				EMOTE: ":dog:",
				CATEGORY:
					"pet"
			},
		PET_TRANSFER:
			{
				EMOTE: ":arrow_right:",
				CATEGORY:
					"pet"
			},
		PET_NICKNAME:
			{
				EMOTE: ":abcd:",
				CATEGORY:
					"pet"
			},
		PET_FREE:
			{
				EMOTE: ":wave:",
				CATEGORY:
					"pet"
			},
		GUILD_SHELTER:
			{
				EMOTE: ":park:",
				CATEGORY:
					"guild"
			},
		PET_TRADE:
			{
				EMOTE: ":scales:",
				CATEGORY:
					"pet"
			},
		PET_FEED:
			{
				EMOTE: ":candy:",
				CATEGORY:
					"pet"
			},
		PET_SELL:
			{
				EMOTE: ":dollar:",
				CATEGORY:
					"pet"
			},
		CLASSES_INFO:
			{
				EMOTE: ":bookmark:",
				CATEGORY:
					"player"
			},
		RARITY:
			{
				EMOTE: ":slot_machine:",
				CATEGORY:
					"util"
			},
		VOTE:
			{
				EMOTE: ":ballot_box:",
				CATEGORY:
					"util"
			},
		IDEA:
			{
				EMOTE: ":bulb:",
				CATEGORY:
					"util"
			},
		DM_NOTIFICATIONS:
			{
				EMOTE: ":no_bell:",
				CATEGORY:
					"util"
			},
		UNLOCK:
			{
				EMOTE: ":slot_machine:",
				CATEGORY:
					"player"
			},
		MAP:
			{
				EMOTE: ":map:",
				CATEGORY:
					"player"
			},
		MISSIONS:
			{
				EMOTE: ":scroll:",
				CATEGORY:
					"mission"
			},
		MISSIONS_SHOP:
			{
				EMOTE: ":shopping_cart:",
				CATEGORY:
					"mission"
			}
	};
}