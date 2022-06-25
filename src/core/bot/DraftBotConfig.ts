export interface DraftBotConfig {
	DISCORD_CLIENT_TOKEN: string;
	BOT_OWNER_ID: string;
	BADGE_MANAGER_ROLE: string;
	SUPPORT_ROLE: string;
	CONTRIBUTOR_ROLE: string;
	CONTRIBUTORS_CHANNEL: string;
	MAIN_SERVER_ID: string;
	CONSOLE_CHANNEL_ID: string;
	FRENCH_ANNOUNCEMENT_CHANNEL_ID: string;
	ENGLISH_ANNOUNCEMENT_CHANNEL_ID: string;
	SUPPORT_CHANNEL_ID: string;
	ENGLISH_CHANNEL_ID: string;
	DBL_WEBHOOK_PORT: number;
	DBL_WEBHOOK_URL: string;
	DBL_VOTE_ROLE: string;
	DBL_LOGS_CHANNEL: string;
	DBL_TOKEN: string;
	MODE_MAINTENANCE: boolean;
	NASA_API_KEY: string;
	ENABLED_BACKUPS: string;
	BACKUP_ARCHIVE_PASSWORD: string;
	DROPBOX_TOKEN: string;
	TEST_MODE: boolean;
}

export const loadConfig = function(): DraftBotConfig {
	return require("../../../../config/app.json") as DraftBotConfig;
};