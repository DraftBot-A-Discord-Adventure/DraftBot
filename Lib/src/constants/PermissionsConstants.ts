export abstract class PermissionsConstants {
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

	static readonly PERMISSION = {
		ROLE: {
			BOT_OWNER: "owner", // Is the owner of the bot
			BADGE_MANAGER: "manager", // Has the badge manager role
			SUPPORT: "support", // Has the support role
			ADMINISTRATOR: "administrator", // Has the admin permission in a server where the bot is.
			CONTRIBUTORS: "contributors",
			ALL: "all"
		}
	};
}
