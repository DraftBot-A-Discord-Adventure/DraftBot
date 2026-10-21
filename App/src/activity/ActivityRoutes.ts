/**
 * Where the services are reached from inside Discord.
 *
 * An Activity can only talk to its own `<client id>.discordsays.com` origin: Discord's proxy forwards each
 * of these prefixes to the host declared for it in the URL mappings of the Developer Portal.
 */
export const ACTIVITY_ROUTES = {
	REST_API: "/api",
	WEBSOCKET: "/ws",

	/** The CDN serving the emoji pictures, `cdn.jsdelivr.net`. */
	EMOJI_CDN: "/cdn"
} as const;

export type ActivityRoute = typeof ACTIVITY_ROUTES[keyof typeof ACTIVITY_ROUTES];

/** The scopes the realm's Discord provider reads, so the account is matched as with a browser sign-in. */
export const ACTIVITY_SCOPES = ["identify", "email"] as const;

/** Same origin as the page, which Discord always serves over HTTPS. */
export function activityUrl(route: ActivityRoute): string {
	return `${window.location.origin}${route}`;
}

export function activityWebSocketUrl(): string {
	const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
	return `${protocol}//${window.location.host}${ACTIVITY_ROUTES.WEBSOCKET}`;
}
