import {parse} from "toml";
import {readFileSync} from "fs";

/**
 * Represents the main constants of the bot
 */
export interface DraftBotConfig {
    DBL_WEBHOOK_PORT: number;
    DBL_WEBHOOK_URL: string;
    DBL_VOTE_ROLE: string;
    DBL_LOGS_CHANNEL: string;
    DBL_TOKEN: string;
    MODE_MAINTENANCE: boolean;
    NASA_API_KEY: string;
    TEST_MODE: boolean;
    MARIADB_HOST: string;
    MARIADB_USER: string;
    MARIADB_PASSWORD: string;
    MARIADB_ROOT_PASSWORD: string;
    MARIADB_PORT: number;
    MARIADB_PREFIX: string;
    WEBSERVER_PORT: number;
}

type ConfigStructure = {
	discord_bot_list: {
		webhook_url: string;
		webhook_port: number;
		channel_id: string;
		vote_role_id: string;
		token: string;
	};
	bot: {
		maintenance: boolean;
		test_mode: boolean;
	};
	others: {
		nasa_api_key: string;
		webserver_port: number;
	};
	database: {
		host: string;
		user: string;
		password: string;
		root_password: string;
		port: number;
		prefix: string;
	};
}

/**
 * Loads the config from the config file
 */
export function loadConfig(): DraftBotConfig {
	const config = parse(readFileSync(`${process.cwd()}/config/config.toml`, "utf-8")) as ConfigStructure;
	return {
		DBL_LOGS_CHANNEL: config.discord_bot_list.channel_id,
		DBL_TOKEN: config.discord_bot_list.token,
		DBL_VOTE_ROLE: config.discord_bot_list.vote_role_id,
		DBL_WEBHOOK_PORT: config.discord_bot_list.webhook_port,
		DBL_WEBHOOK_URL: config.discord_bot_list.webhook_url,
		MODE_MAINTENANCE: config.bot.maintenance,
		NASA_API_KEY: config.others.nasa_api_key,
		TEST_MODE: config.bot.test_mode,
		MARIADB_HOST: config.database.host,
		MARIADB_USER: config.database.user,
		MARIADB_PASSWORD: config.database.password,
		MARIADB_ROOT_PASSWORD: config.database.root_password,
		MARIADB_PORT: config.database.port,
		MARIADB_PREFIX: config.database.prefix,
		WEBSERVER_PORT: config.others.webserver_port
	};
}