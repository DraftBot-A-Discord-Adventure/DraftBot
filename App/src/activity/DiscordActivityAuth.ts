import { ACTIVITY_SCOPES } from "@/src/activity/ActivityRoutes";
import { discordSdk } from "@/src/activity/DiscordLaunch";
import {
	DiscordActivityRequestFailure, RestApi
} from "@/src/networking/RestApi";
import {
	AUTH_FAILURES, AuthFailure, AuthFailureReason
} from "@/src/authentication/AuthFailure";
import { SessionGrant } from "@/src/authentication/KeycloakOAuth2Token";
import {
	DISCORD_ACTIVITY_ERRORS, DiscordActivityError
} from "../../../WsPackets/src/objects/DiscordActivity";

const FAILURE_REASONS: Record<DiscordActivityError, AuthFailureReason> = {
	[DISCORD_ACTIVITY_ERRORS.DISABLED]: AUTH_FAILURES.UNREACHABLE,
	[DISCORD_ACTIVITY_ERRORS.UNAUTHORIZED]: AUTH_FAILURES.INVALID_TOKEN,
	[DISCORD_ACTIVITY_ERRORS.REFUSED]: AUTH_FAILURES.ACCOUNT_NOT_LINKED,
	[DISCORD_ACTIVITY_ERRORS.UNAVAILABLE]: AUTH_FAILURES.UNREACHABLE
};

/** RestWs refusals are said like any other sign-in failure, and an expired session asks for a new sign-in. */
async function sayableFailures(request: Promise<SessionGrant>): Promise<SessionGrant> {
	try {
		return await request;
	}
	catch (error) {
		if (error instanceof DiscordActivityRequestFailure) {
			throw new AuthFailure(FAILURE_REASONS[error.reason], error.reason);
		}
		throw error;
	}
}

/**
 * Signs in the player Discord already knows: past the first launch, Discord asks nothing and the game opens
 * straight away. The code it hands over is only worth something to RestWs, which holds the application secret.
 */
export async function signInThroughDiscord(): Promise<SessionGrant> {
	const sdk = discordSdk();
	await sdk.ready();
	let code: string;
	try {
		// The SDK takes the OAuth 2.0 parameter names as they are
		/* eslint-disable camelcase */
		({ code } = await sdk.commands.authorize({
			client_id: sdk.clientId,
			response_type: "code",
			state: "",
			prompt: "none",
			scope: [...ACTIVITY_SCOPES]
		}));
		/* eslint-enable camelcase */
	}
	catch (error) {
		throw new AuthFailure(AUTH_FAILURES.DENIED, error instanceof Error ? error.message : String(error));
	}
	return sayableFailures(RestApi.openDiscordActivitySession(code));
}

export function refreshThroughDiscordActivity(refreshToken: string): Promise<SessionGrant> {
	return sayableFailures(RestApi.refreshDiscordActivitySession(refreshToken));
}
