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

const SECURE_PROTOCOLS = {
	HTTP: "https:",
	WEBSOCKET: "wss:"
} as const;

type SecureProtocol = typeof SECURE_PROTOCOLS[keyof typeof SECURE_PROTOCOLS];

/** The scopes the realm's Discord provider reads, so the account is matched as with a browser sign-in. */
export const ACTIVITY_SCOPES = ["identify", "email"] as const;

export function activityUrl(route: ActivityRoute, protocol: SecureProtocol = SECURE_PROTOCOLS.HTTP): string {
	return `${protocol}//${window.location.host}${route}`;
}

export function activityWebSocketUrl(): string {
	return activityUrl(ACTIVITY_ROUTES.WEBSOCKET, SECURE_PROTOCOLS.WEBSOCKET);
}
