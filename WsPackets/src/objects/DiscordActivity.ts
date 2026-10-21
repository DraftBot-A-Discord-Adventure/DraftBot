/**
 * Routes through which the Discord Activity signs a player in.
 *
 * Inside Discord, the player is already signed in to Discord: the Embedded App SDK hands the Activity an
 * authorization code, which RestWs turns into a session of the app. That session is issued to RestWs,
 * so it is also refreshed through RestWs.
 */
export const DISCORD_ACTIVITY_ENDPOINTS = {
	SESSION: "/discord-activity/session",
	REFRESH: "/discord-activity/refresh"
} as const;

export const DISCORD_ACTIVITY_ERRORS = {
	/** The server does not host the Activity. */
	DISABLED: "disabled",

	/** The code or the refresh token was not accepted: the player has to be signed in again. */
	UNAUTHORIZED: "unauthorized",

	/** Keycloak refused to open a session for this Discord account, which is not linked to its game account yet. */
	REFUSED: "refused",
	UNAVAILABLE: "unavailable"
} as const;

export type DiscordActivityError = typeof DISCORD_ACTIVITY_ERRORS[keyof typeof DISCORD_ACTIVITY_ERRORS];

export type DiscordActivitySessionRequest = {
	code: string;
};

export type DiscordActivityRefreshRequest = {
	refreshToken: string;
};

/** The Keycloak token response, as the app already reads it after a browser sign-in. */
export type DiscordActivitySession = {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	refresh_expires_in: number;
};
