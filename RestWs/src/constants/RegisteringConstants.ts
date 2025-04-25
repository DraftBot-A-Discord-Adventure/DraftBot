export abstract class RegisteringConstants {
	/**
	 * Usernames that start with these prefixes are not allowed
	 */
	static readonly DISALLOWED_USERNAME_PREFIXES = ["discord-"];

	/**
	 * Keycloak role that is allowed to log in if the beta login is enabled
	 */
	static readonly BETA_GROUP = "beta";
}
