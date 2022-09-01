import {parse} from "toml";
import {readFileSync} from "fs";

/**
 * Represents the main constants of the bot
 */
export interface DraftBotConfig {
	DISCORD_CLIENT_TOKEN: string;
	BOT_OWNER_ID: string;
	BADGE_MANAGER_ROLE: string;
	CONTRIBUTOR_ROLE: string;
	CONTRIBUTORS_CHANNEL: string;
	MAIN_SERVER_ID: string;
	CONSOLE_CHANNEL_ID: string;
	FRENCH_ANNOUNCEMENT_CHANNEL_ID: string;
	ENGLISH_ANNOUNCEMENT_CHANNEL_ID: string;
	DM_MANAGER_ID: string;
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
	MARIADB_HOST: string;
	MARIADB_USER: string;
	MARIADB_PASSWORD: string;
	MARIADB_ROOT_PASSWORD: string;
	MARIADB_PORT: number;
}

/**
 * Loads the config from the config file
 */
export function loadConfig(): DraftBotConfig {
	const config = parse(readFileSync(process.cwd() + "/config/config.toml", "utf-8"));
	return {
		BACKUP_ARCHIVE_PASSWORD: config.backups.archive_password,
		BADGE_MANAGER_ROLE: config.discord.roles.badge_manager_ids,
		BOT_OWNER_ID: config.discord.users.owner_id,
		CONSOLE_CHANNEL_ID: config.discord.channels.console_channel_id,
		CONTRIBUTORS_CHANNEL: config.discord.channels.contributor_channel,
		CONTRIBUTOR_ROLE: config.discord.roles.contributor_role_id,
		DBL_LOGS_CHANNEL: config.discord_bot_list.channel_id,
		DBL_TOKEN: config.discord_bot_list.token,
		DBL_VOTE_ROLE: config.discord_bot_list.vote_role_id,
		DBL_WEBHOOK_PORT: config.discord_bot_list.webhook_port,
		DBL_WEBHOOK_URL: config.discord_bot_list.webhook_url,
		DISCORD_CLIENT_TOKEN: config.discord.general.token,
		DM_MANAGER_ID: config.discord.users.dm_manager_id,
		DROPBOX_TOKEN: config.backups.dropbox_token,
		ENABLED_BACKUPS: config.backups.enabled,
		ENGLISH_ANNOUNCEMENT_CHANNEL_ID: config.discord.channels.english_announcements_channel_id,
		ENGLISH_CHANNEL_ID: config.discord.channels.english_channel_id,
		FRENCH_ANNOUNCEMENT_CHANNEL_ID: config.discord.channels.french_announcements_channel_id,
		MAIN_SERVER_ID: config.discord.general.main_server_id,
		MODE_MAINTENANCE: config.bot.maintenance,
		NASA_API_KEY: config.others.nasa_api_key,
		TEST_MODE: config.bot.test_mode,
		MARIADB_HOST: config.database.host,
		MARIADB_USER: config.database.user,
		MARIADB_PASSWORD: config.database.password,
		MARIADB_ROOT_PASSWORD: config.database.root_password,
		MARIADB_PORT: config.database.port
	};
}