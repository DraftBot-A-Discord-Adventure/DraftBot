import {
	AuthRequest,
	makeRedirectUri,
	ResponseType,
	type AuthRequestPromptOptions,
	type DiscoveryDocument
} from "expo-auth-session";
import {
	openAuthSessionAsync, type WebBrowserAuthSessionResult
} from "expo-web-browser";
import { Appearance } from "react-native";
import { KeycloakOAuth2Token } from "@/src/authentication/KeycloakOAuth2Token";
import {
	AUTH_FAILURES, AuthFailure, failureOfAuthResult
} from "@/src/authentication/AuthFailure";
import { PALETTES } from "@/src/design/Theme";
import { resolveScheme } from "@/src/design/ThemeContext";
import { storedThemePreference } from "@/src/design/ThemePreference";
import { currentLanguage } from "@/src/translations/i18nLoader";

/**
 * Aliases of the identity providers declared in the realm.
 *
 * Naming one lets the app skip the Keycloak provider picker, which is the only reason it has to
 * know them at all: adding a provider to the realm still requires no change here.
 */
export const IDENTITY_PROVIDERS = {
	DISCORD: "discord"
} as const;

export type IdentityProvider = typeof IDENTITY_PROVIDERS[keyof typeof IDENTITY_PROVIDERS];

const AUTH_PROMPTS = {
	LOGIN: "login",
	REGISTER: "create"
} as const;

type AuthPrompt = typeof AUTH_PROMPTS[keyof typeof AUTH_PROMPTS];

/** Account actions the app asks Keycloak to run on a signed-in player. */
const KEYCLOAK_ACTIONS = {
	UPDATE_EMAIL: "UPDATE_EMAIL",
	UPDATE_PASSWORD: "UPDATE_PASSWORD"
} as const;

type KeycloakAction = typeof KEYCLOAK_ACTIONS[keyof typeof KEYCLOAK_ACTIONS];
const LOGIN_HINT_PARAMETER = "login_hint";

type AuthorizationParameters = {
	prompt: AuthPrompt; kc_idp_hint?: IdentityProvider; kc_action?: KeycloakAction; [LOGIN_HINT_PARAMETER]?: string;
};

/** How an account action ended when its browser window closed. */
export const ACCOUNT_ACTION_OUTCOMES = {
	/** An email change sent its confirmation link: the new address replaces the current one once opened. */
	PENDING: "pending",
	UPDATED: "updated",
	CANCELLED: "cancelled"
} as const;

export type AccountActionOutcome = typeof ACCOUNT_ACTION_OUTCOMES[keyof typeof ACCOUNT_ACTION_OUTCOMES];

/** Values of `kc_action_status`, the parameter Keycloak adds when an account action ends. */
const ACTION_STATUSES = {
	SUCCESS: "success",
	CANCELLED: "cancelled"
} as const;

/** React Native's `URL` lacks `searchParams`: the few parameters read here are matched directly. */
function queryParameter(url: string, name: string): string | undefined {
	const value = new RegExp(`[?&]${name}=([^&#]*)`, "u").exec(url)?.[1];
	return value === undefined ? undefined : decodeURIComponent(value);
}

/**
 * The confirmation page offers a way back to the game which carries no parameter: Keycloak still
 * waits for the link at that point, so it cannot end the action itself.
 */
function accountActionOutcome(result: WebBrowserAuthSessionResult): AccountActionOutcome {
	if (result.type !== "success") {
		return ACCOUNT_ACTION_OUTCOMES.CANCELLED;
	}
	const error = queryParameter(result.url, "error");
	if (error) {
		throw new AuthFailure(AUTH_FAILURES.UNKNOWN, queryParameter(result.url, "error_description") ?? error);
	}
	switch (queryParameter(result.url, "kc_action_status")) {
		case undefined:
			return ACCOUNT_ACTION_OUTCOMES.PENDING;
		case ACTION_STATUSES.SUCCESS:
			return ACCOUNT_ACTION_OUTCOMES.UPDATED;
		case ACTION_STATUSES.CANCELLED:
			return ACCOUNT_ACTION_OUTCOMES.CANCELLED;
		default:
			throw new AuthFailure(AUTH_FAILURES.UNKNOWN, "Keycloak could not run the account action.");
	}
}

/**
 * Dressing of the in-app browser that shows the Keycloak pages.
 *
 * iOS ignores every one of these: its auth session is an `ASWebAuthenticationSession`, already
 * presented as a sheet and offering no styling. They shape the Android custom tab, whose default
 * chrome would otherwise announce a website in the middle of the game.
 */
/** Read when the browser opens: the auth pages live outside the React tree, so they take the palette of the moment. */
function browserPresentation(prompt: AuthPrompt): AuthRequestPromptOptions {
	const colors = PALETTES[resolveScheme(storedThemePreference(), Appearance.getColorScheme())];
	return {
		toolbarColor: colors.paper,
		controlsColor: colors.ink,
		showTitle: false,
		...prompt === AUTH_PROMPTS.LOGIN ? { preferEphemeralSession: true } : {}
	};
}

// Expo inlines the EXPO_PUBLIC_ variables at build time, so each one has to be read literally.
function requireEnv(value: string | undefined, name: string): string {
	if (!value) {
		throw new Error(`${name} is not defined in the environment variables.`);
	}
	return value;
}

function getClientId(): string {
	return requireEnv(process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID, "EXPO_PUBLIC_KEYCLOAK_CLIENT_ID");
}

function getRealmUrl(): string {
	const url = requireEnv(process.env.EXPO_PUBLIC_KEYCLOAK_URL, "EXPO_PUBLIC_KEYCLOAK_URL");
	const realm = requireEnv(process.env.EXPO_PUBLIC_KEYCLOAK_REALM, "EXPO_PUBLIC_KEYCLOAK_REALM");
	return `${url}/realms/${realm}`;
}

function getDiscovery(): DiscoveryDocument {
	const realmUrl = getRealmUrl();
	return {
		authorizationEndpoint: `${realmUrl}/protocol/openid-connect/auth`,
		tokenEndpoint: `${realmUrl}/protocol/openid-connect/token`,
		endSessionEndpoint: `${realmUrl}/protocol/openid-connect/logout`
	};
}

function getRedirectUri(): string {
	return makeRedirectUri({
		scheme: "crownicles",
		path: "auth"
	});
}

function hasCompleteToken(token: KeycloakOAuth2Token): boolean {
	return Boolean(token.access_token && token.refresh_token)
		&& Number.isFinite(token.expires_in)
		&& token.expires_in > 0
		&& Number.isFinite(token.refresh_expires_in)
		&& token.refresh_expires_in >= 0;
}

/**
 * Authenticates against Keycloak with Authorization Code + PKCE.
 *
 * Keycloak brokers the actual identity providers (Discord today, others later), so this flow stays
 * the same whichever provider the player picks. Naming one sends them straight to it.
 */
export class KeycloakAuth {
	public static login(identityProvider?: IdentityProvider): Promise<KeycloakOAuth2Token> {
		return KeycloakAuth.authorize({
			prompt: AUTH_PROMPTS.LOGIN,
			...identityProvider ? { kc_idp_hint: identityProvider } : {}
		});
	}

	/** Signs in to the account known by this address or pseudo, already typed in. */
	public static loginAs(account: string): Promise<KeycloakOAuth2Token> {
		return KeycloakAuth.authorize({
			prompt: AUTH_PROMPTS.LOGIN, [LOGIN_HINT_PARAMETER]: account
		});
	}

	/**
	 * Opens Keycloak's sign-up page: a pseudo and an address, then the link sent there confirms it
	 * and signs the player in, wherever it is opened.
	 */
	public static register(): Promise<KeycloakOAuth2Token> {
		return KeycloakAuth.authorize({ prompt: AUTH_PROMPTS.REGISTER });
	}

	/** Opens Keycloak's email change, once the player signed in again. */
	public static changeEmail(): Promise<AccountActionOutcome> {
		return KeycloakAuth.runAccountAction(KEYCLOAK_ACTIONS.UPDATE_EMAIL);
	}

	/** Sets or replaces the password, which spares waiting for a link to sign in. */
	public static changePassword(): Promise<AccountActionOutcome> {
		return KeycloakAuth.runAccountAction(KEYCLOAK_ACTIONS.UPDATE_PASSWORD);
	}

	/**
	 * The code Keycloak hands back is never exchanged: the app keeps its own session, and only needs
	 * to know how the action ended.
	 */
	private static async runAccountAction(action: KeycloakAction): Promise<AccountActionOutcome> {
		const entryParams: AuthorizationParameters = {
			prompt: AUTH_PROMPTS.LOGIN,
			kc_action: action
		};
		const url = await KeycloakAuth.authRequest(entryParams).makeAuthUrlAsync(getDiscovery());
		return accountActionOutcome(await openAuthSessionAsync(url, getRedirectUri(), browserPresentation(entryParams.prompt)));
	}

	/** Read from Keycloak rather than from the token, whose copy only changes at its next refresh. */
	public static async accountEmail(accessToken: string): Promise<string | null> {
		const response = await fetch(`${getRealmUrl()}/protocol/openid-connect/userinfo`, {
			headers: { Authorization: `Bearer ${accessToken}` }
		});

		if (!response.ok) {
			throw new AuthFailure(AUTH_FAILURES.UNREACHABLE, `Keycloak userinfo request failed with status ${response.status}`);
		}

		const userInfo = await response.json() as { email?: string };
		return userInfo.email ?? null;
	}

	private static authRequest(entryParams: AuthorizationParameters): AuthRequest {
		/*
		 * Typed as a string, but i18next answers nothing until it has loaded its resources, and
		 * login is reachable before that.
		 */
		const language = currentLanguage() as string | undefined;
		return new AuthRequest({
			clientId: getClientId(),
			redirectUri: getRedirectUri(),
			scopes: ["openid", "offline_access"],
			responseType: ResponseType.Code,
			usePKCE: true,
			extraParams: {
				/*
				 * Keycloak falls back to the realm default without this, so its pages would ignore
				 * the language the player already chose in the app.
				 */
				...language ? { ui_locales: language } : {},
				...entryParams
			}
		});
	}

	private static async authorize(entryParams: AuthorizationParameters): Promise<KeycloakOAuth2Token> {
		const request = KeycloakAuth.authRequest(entryParams);
		const result = await request.promptAsync(getDiscovery(), browserPresentation(entryParams.prompt));

		if (result.type !== "success") {
			throw failureOfAuthResult(result);
		}

		return KeycloakAuth.requestToken({
			grant_type: "authorization_code",
			code: result.params.code,
			redirect_uri: getRedirectUri(),
			code_verifier: request.codeVerifier ?? ""
		});
	}

	public static refresh(refreshToken: string): Promise<KeycloakOAuth2Token> {
		return KeycloakAuth.requestToken({
			grant_type: "refresh_token",
			refresh_token: refreshToken
		});
	}

	/*
	 * Queried directly instead of through expo-auth-session, whose token model drops the
	 * refresh_expires_in field that the app needs to know when a re-login is required.
	 */
	private static async requestToken(params: Record<string, string>): Promise<KeycloakOAuth2Token> {
		const response = await fetch(`${getRealmUrl()}/protocol/openid-connect/token`, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			body: new URLSearchParams({
				client_id: getClientId(),
				...params
			}).toString()
		});

		if (!response.ok) {
			throw new AuthFailure(AUTH_FAILURES.UNREACHABLE, `Keycloak token request failed with status ${response.status}`);
		}

		const token = await response.json() as KeycloakOAuth2Token;

		if (!hasCompleteToken(token)) {
			throw new AuthFailure(AUTH_FAILURES.INVALID_TOKEN, "Keycloak returned an incomplete token.");
		}

		return token;
	}
}
