/**
 * Database configuration
 *
 * @interface DatabaseConfiguration
 * @property {string} host The database host
 * @property {number} port The database port
 * @property {string} rootUser The root user
 * @property {string} rootPassword The root user password
 * @property {string} user The user
 * @property {string} userPassword The user password
 * @property {string} databaseName The database name. For example "game" or "notifications"
 * @property {string} prefix The database prefix used to name the databases. For example, if the prefix is "draftbot_beta" and the database is "game", the database will be named "draftbot_beta_game"
 */
export type DatabaseConfiguration = {
	host: string;
	port: number;
	rootUser: string;
	rootPassword: string;
	user: string;
	userPassword: string;
	databaseName: string;
	prefix: string;
};
