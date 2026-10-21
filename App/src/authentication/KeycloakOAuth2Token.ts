/**
 * Keycloak OAuth2 token format return from Keycloak
 */
export interface KeycloakOAuth2Token {
	access_token: string;
	expires_in: number;
	refresh_expires_in: number;
	refresh_token: string;
	token_type: string;
	session_state: string;
	scope: string;
}

/** What opening a session hands the app, whichever way the player signed in. */
export type SessionGrant = Pick<KeycloakOAuth2Token, "access_token" | "refresh_token" | "expires_in" | "refresh_expires_in">;
