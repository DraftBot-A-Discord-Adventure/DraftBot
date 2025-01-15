import {parse} from "toml";
import {readFileSync} from "fs";
import {DatabaseConfiguration} from "../../../../Lib/src/database/DatabaseConfiguration";

/**
 * Represents the main constants of the bot
 */
export interface DraftBotConfig {
	MODE_MAINTENANCE: boolean;
	TEST_MODE: boolean;
	PREFIX: string;
	MARIADB_HOST: string;
	MARIADB_USER: string;
	MARIADB_PASSWORD: string;
	MARIADB_ROOT_PASSWORD: string;
	MARIADB_PORT: number;
	MQTT_HOST: string;
}

type ConfigStructure = {
	bot: {
		maintenance: boolean;
		test_mode: boolean;
		prefix: string;
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
	};
	mqtt: {
		host: string;
	};
}

/**
 * Loads the config from the config file
 */
export function loadConfig(): DraftBotConfig {
	const config = parse(readFileSync(`${process.cwd()}/config/config.toml`, "utf-8")) as ConfigStructure;
	return {
		MODE_MAINTENANCE: config.bot.maintenance,
		TEST_MODE: config.bot.test_mode,
		PREFIX: config.bot.prefix,
		MARIADB_HOST: config.database.host,
		MARIADB_USER: config.database.user,
		MARIADB_PASSWORD: config.database.password,
		MARIADB_ROOT_PASSWORD: config.database.root_password,
		MARIADB_PORT: config.database.port,
		MQTT_HOST: config.mqtt.host
	};
}

export function getDatabaseConfiguration(config: DraftBotConfig, databaseName: string): DatabaseConfiguration {
	return {
		host: config.MARIADB_HOST,
		port: config.MARIADB_PORT,
		rootUser: "root",
		rootPassword: config.MARIADB_ROOT_PASSWORD,
		user: config.MARIADB_USER,
		userPassword: config.MARIADB_PASSWORD,
		databaseName,
		prefix: config.PREFIX
	};
}