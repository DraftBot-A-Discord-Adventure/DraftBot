/* eslint-disable camelcase -- the fields sent to and read from Discord and Keycloak follow the OAuth 2.0 naming */
import { KeycloakConfig } from "../../../Lib/src/keycloak/KeycloakConfig";
import { CrowniclesLogger } from "../../../Lib/src/logs/CrowniclesLogger";
import { DiscordActivityConfig } from "../config/RestWsConfig";
import {
	DISCORD_ACTIVITY_ERRORS, DiscordActivityError, DiscordActivitySession
} from "../../../WsPackets/src/objects/DiscordActivity";

const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";

/** Alias of the realm's Discord identity provider, whose links tie a Discord account to its game account. */
const DISCORD_IDENTITY_PROVIDER = "discord";

const TOKEN_EXCHANGE_GRANT = "urn:ietf:params:oauth:grant-type:token-exchange";
const ACCESS_TOKEN_TYPE = "urn:ietf:params:oauth:token-type:access_token";
const REFRESH_TOKEN_TYPE = "urn:ietf:params:oauth:token-type:refresh_token";

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_SERVICE_UNAVAILABLE = 503;
const HTTP_SERVER_ERROR = 500;

export class DiscordActivityFailure extends Error {
	public constructor(public readonly reason: DiscordActivityError, public readonly status: number) {
		super(reason);
	}
}

type KeycloakTokenAnswer = Partial<DiscordActivitySession> & {
	error?: string; error_description?: string;
};

type KeycloakTokenResponse = {
	ok: boolean; status: number; body: KeycloakTokenAnswer;
};

function unavailable(): DiscordActivityFailure {
	return new DiscordActivityFailure(DISCORD_ACTIVITY_ERRORS.UNAVAILABLE, HTTP_SERVICE_UNAVAILABLE);
}

function isSession(answer: KeycloakTokenAnswer): answer is DiscordActivitySession {
	return Boolean(answer.access_token && answer.refresh_token)
		&& typeof answer.expires_in === "number"
		&& typeof answer.refresh_expires_in === "number";
}

/** Only the fields the app reads leave RestWs, the rest of Keycloak's answer stays here. */
function sessionOf(answer: KeycloakTokenAnswer): DiscordActivitySession {
	if (!isSession(answer)) {
		throw unavailable();
	}
	return {
		access_token: answer.access_token,
		refresh_token: answer.refresh_token,
		expires_in: answer.expires_in,
		refresh_expires_in: answer.refresh_expires_in
	};
}

/**
 * Opens and refreshes the sessions of players signed in through the Discord Activity.
 *
 * Discord hands the Activity an authorization code of the Discord application; RestWs, which holds that
 * application's secret, turns it into a Discord access token, then asks Keycloak to exchange it for a session
 * of the player's game account. Keycloak validates the Discord token itself and matches the account through
 * its Discord link, so this service never decides who the player is.
 */
export class DiscordActivitySessions {
	public constructor(private readonly keycloak: KeycloakConfig, private readonly activity: DiscordActivityConfig) {}

	public get enabled(): boolean {
		return Boolean(this.activity.CLIENT_ID && this.activity.CLIENT_SECRET);
	}

	public async open(code: string): Promise<DiscordActivitySession> {
		const discordToken = await this.discordAccessToken(code);
		const answer = await this.keycloakToken({
			grant_type: TOKEN_EXCHANGE_GRANT,
			subject_token: discordToken,
			subject_issuer: DISCORD_IDENTITY_PROVIDER,
			subject_token_type: ACCESS_TOKEN_TYPE,
			requested_token_type: REFRESH_TOKEN_TYPE,
			audience: this.activity.APP_CLIENT_ID
		});
		if (answer.status >= HTTP_SERVER_ERROR) {
			throw unavailable();
		}
		if (!answer.ok) {
			// A Discord account whose game account exists without a link to it is refused rather than captured.
			CrowniclesLogger.warn("Keycloak refused a Discord Activity session", {
				keycloakError: answer.body.error, description: answer.body.error_description
			});
			throw new DiscordActivityFailure(DISCORD_ACTIVITY_ERRORS.REFUSED, HTTP_FORBIDDEN);
		}
		return sessionOf(answer.body);
	}

	public async refresh(refreshToken: string): Promise<DiscordActivitySession> {
		const answer = await this.keycloakToken({
			grant_type: "refresh_token",
			refresh_token: refreshToken
		});
		if (answer.status >= HTTP_SERVER_ERROR) {
			throw unavailable();
		}
		if (!answer.ok) {
			throw new DiscordActivityFailure(DISCORD_ACTIVITY_ERRORS.UNAUTHORIZED, HTTP_UNAUTHORIZED);
		}
		return sessionOf(answer.body);
	}

	private async discordAccessToken(code: string): Promise<string> {
		const response = await fetch(DISCORD_TOKEN_URL, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				client_id: this.activity.CLIENT_ID,
				client_secret: this.activity.CLIENT_SECRET,
				grant_type: "authorization_code",
				code
			}).toString()
		}).catch(() => {
			throw unavailable();
		});
		if (response.status >= HTTP_SERVER_ERROR) {
			throw unavailable();
		}
		const answer = await response.json().catch(() => ({})) as { access_token?: string };
		if (!response.ok || !answer.access_token) {
			throw new DiscordActivityFailure(DISCORD_ACTIVITY_ERRORS.UNAUTHORIZED, HTTP_UNAUTHORIZED);
		}
		return answer.access_token;
	}

	private async keycloakToken(params: Record<string, string>): Promise<KeycloakTokenResponse> {
		const response = await fetch(`${this.keycloak.url}/realms/${this.keycloak.realm}/protocol/openid-connect/token`, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				client_id: this.keycloak.clientId,
				client_secret: this.keycloak.clientSecret,
				...params
			}).toString()
		}).catch(() => {
			throw unavailable();
		});
		return {
			ok: response.ok,
			status: response.status,
			body: await response.json().catch(() => ({})) as KeycloakTokenAnswer
		};
	}
}
