export abstract class WebSocketConstants {
	/**
	 * Purge closed connections interval in milliseconds
	 */
	static readonly PURGE_INTERVAL = 30000;

	/**
	 * Ping interval in milliseconds: a socket silent for two of them is closed
	 */
	static readonly HEARTBEAT_INTERVAL = 30000;

	/**
	 * Messages kept while a new connection is being verified; an unverified client sending more is ignored
	 */
	static readonly MAX_MESSAGES_BEFORE_ADMISSION = 32;
}
