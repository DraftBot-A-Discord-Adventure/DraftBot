import {parse} from "toml";
import {readFileSync} from "fs";

/**
 * Represents the main constants of the bot
 */
export interface DraftBotConfig {
	DISCORD_CLIENT_TOKEN: string;
	BADGE_MANAGER_ROLE: string;
	CONTRIBUTOR_ROLE: string;
	CONTRIBUTORS_CHANNEL: string;
	MAIN_SERVER_ID: string;
	CONSOLE_CHANNEL_ID: string;
	FRENCH_ANNOUNCEMENT_CHANNEL_ID: string;
	ENGLISH_ANNOUNCEMENT_CHANNEL_ID: string;
	DM_MANAGER_ID: string;
	ENGLISH_CHANNEL_ID: string;
}

type ConfigStructure = {
	general: {
		token: string;
		main_server_id: string;
	};
	roles: {
		badge_manager_ids: string;
		contributor_role_id: string;
	};
	channels: {
		console_channel_id: string;
		contributor_channel: string;
		english_announcements_channel_id: string;
		french_announcements_channel_id: string;
		english_channel_id: string;
	};
	users: {
		owner_id: string;
		dm_manager_id: string;
	};
}

/**
 * Loads the config from the config file
 */
export function loadConfig(): DraftBotConfig {
	const config = parse(readFileSync(`${process.cwd()}/config/config.toml`, "utf-8")) as ConfigStructure;
	return {
		BADGE_MANAGER_ROLE: config.roles.badge_manager_ids,
		CONSOLE_CHANNEL_ID: config.channels.console_channel_id,
		CONTRIBUTORS_CHANNEL: config.channels.contributor_channel,
		CONTRIBUTOR_ROLE: config.roles.contributor_role_id,
		DISCORD_CLIENT_TOKEN: config.general.token,
		DM_MANAGER_ID: config.users.dm_manager_id,
		ENGLISH_ANNOUNCEMENT_CHANNEL_ID: config.channels.english_announcements_channel_id,
		ENGLISH_CHANNEL_ID: config.channels.english_channel_id,
		FRENCH_ANNOUNCEMENT_CHANNEL_ID: config.channels.french_announcements_channel_id,
		MAIN_SERVER_ID: config.general.main_server_id,
	};
}