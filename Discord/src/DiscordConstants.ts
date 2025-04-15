export abstract class DiscordConstants {
	static MAX_BUTTONS_PER_ROW = 5;

	static MAX_SELECT_MENU_OPTIONS = 25;

	static COMMAND_TIMEOUT_MS = 3000;

	static MQTT = {
		SHARD_CONNECTION_MSG: "connected:",
		SHARD_DUPLICATED_MSG: "shardDuplicated:"
	};
}
