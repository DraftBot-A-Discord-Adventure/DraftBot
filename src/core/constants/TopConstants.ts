export abstract class TopConstants {
	static readonly GLOBAL_SCOPE = "global";

	static readonly SERVER_SCOPE = "server";

	static readonly TIMING_ALLTIME = "alltime";

	static readonly TIMING_WEEKLY = "weekly";

	static readonly TOP_GUILD_NOT_RANKED_REASON = {
		NO_GUILD: -1,
		ZERO_POINTS: -2
	};

	static readonly PLAYERS_PER_PAGE = 15;

	static readonly GUILDS_PER_PAGE = 15;

	static readonly INACTIVE_BADGE = ":ghost:";

	static readonly TOP_POSITION_BADGE = {
		FIRST: ":first_place:",
		SECOND: ":second_place:",
		THIRD: ":third_place:",
		MILITARY: ":military_medal:",
		BLUE: ":blue_circle:",
		BLACK: ":black_circle:",
		WHITE: ":white_circle:"
	};

	static readonly LINK_CLOCK_FOOTER = "https://i.imgur.com/OpL9WpR.png";

	static readonly FIFTEEN_DAYS = 1296000000;

	static EMOTE = {
		GLORY: ":sparkles:",
		SCORE: ":trophy:"
	};
}