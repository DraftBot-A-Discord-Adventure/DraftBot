import React, {
	PropsWithChildren, useEffect
} from "react";
import {
	useNavigationContainerRef, useRouter
} from "expo-router";
import {
	deleteStoredToken, readFullStoredToken, readStoredToken, TOKEN_STORAGE_KEY_TEMPLATE, writeStoredToken
} from "@/src/authentication/TokenStorage";
import { WebSocketClient } from "@/src/networking/WebSocketClient";
import { AuthToken } from "@/src/authentication/AuthToken";
import { AuthStateEnum } from "@/src/authentication/AuthStateEnum";
import { collectorsStore } from "@/src/collectors/CollectorsStore";
import { reportEventStore } from "@/src/collectors/ReportEventStore";
import { fightStore } from "@/src/store/FightStore";
import {
	isAccountCollisionOpen, RestApi
} from "@/src/networking/RestApi";

/** States of a session already shown to the player: logging in again from them is not a first arrival */
const SESSION_STATES: ReadonlySet<AuthStateEnum> = new Set([
	AuthStateEnum.LOGGED_IN,
	AuthStateEnum.RECONNECTING_NO_PACKET_QUEUE,
	AuthStateEnum.RECONNECTING_PACKET_QUEUE
]);

/** The root screens on either side of the session. */
const ROOT_SCREENS = {
	GAME: "(protected)",
	LOGIN: "login"
} as const;

type RootScreen = typeof ROOT_SCREENS[keyof typeof ROOT_SCREENS];

/** States that send the player back to the login screen */
const LOGIN_STATES: ReadonlySet<AuthStateEnum> = new Set([
	AuthStateEnum.NO_TOKEN,
	AuthStateEnum.TOKEN_INVALID_OR_EXPIRED,
	AuthStateEnum.ACCOUNT_COLLISION
]);

async function loadStoredToken(): Promise<AuthToken | null> {
	const token = await readFullStoredToken().catch(error => {
		console.error("Failed to load token:", error);
		return "";
	});
	return token ? AuthToken.fromJsonString(token) : null;
}

/** Whether two accounts sharing an email must be settled before the session can open */
async function collisionBlocks(authToken: AuthToken): Promise<boolean> {
	const accessToken = authToken.getAccessToken();
	return accessToken ? isAccountCollisionOpen(await RestApi.checkAccountCollision(accessToken)) : false;
}

type AuthState = {
	state: AuthStateEnum;
	setState: (state: AuthStateEnum) => void;
	saveToken: (token: AuthToken) => Promise<void>;
	clearToken: () => Promise<void>;
};

export const AuthContext = React.createContext<AuthState>({
	state: AuthStateEnum.NOT_READY,
	setState: () => {
		console.warn("setState called without AuthContext.Provider");
	},
	saveToken: (_token: AuthToken): Promise<void> => {
		console.warn("saveToken called without AuthContext.Provider");
		return Promise.resolve();
	},
	clearToken: (): Promise<void> => {
		console.warn("clearToken called without AuthContext.Provider");
		return Promise.resolve();
	}
});

export function AuthProvider({ children }: PropsWithChildren): React.ReactElement {
	const [state, setState] = React.useState(AuthStateEnum.NOT_READY); // Persist state: https://youtu.be/yNaOaR2kIa0?t=649
	const currentState = React.useRef(state);
	const tokenEdits = React.useRef<Promise<void>>(Promise.resolve());
	const router = useRouter();
	const navigationRef = useNavigationContainerRef();
	const initialNavigationTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

	const cancelPendingNavigation = (): void => {
		if (initialNavigationTimer.current !== null) {
			clearTimeout(initialNavigationTimer.current);
			initialNavigationTimer.current = null;
		}
	};

	/**
	 * Leaves the given screen alone in the root stack, so going back never crosses the session
	 * boundary. A link opened from a mail can stack the game over the login screen, for instance.
	 *
	 * AuthProvider is mounted just above the root navigator, so the first websocket callback can run
	 * before Expo Router has mounted it: the reset waits for it instead of being lost.
	 */
	const resetRootTo = (screen: RootScreen): void => {
		cancelPendingNavigation();
		const attempt = (): void => {
			if (!navigationRef.isReady()) {
				initialNavigationTimer.current = setTimeout(attempt, 100);
				return;
			}
			initialNavigationTimer.current = null;
			navigationRef.reset({
				index: 0, routes: [{ name: screen }]
			});
		};
		attempt();
	};

	const clearStoredToken = async (): Promise<void> => {
		let shouldContinue = true;
		let count = 1;
		while (shouldContinue) {
			const tokenStorageKey = `${TOKEN_STORAGE_KEY_TEMPLATE}${count}`;
			count++;
			const result = await readStoredToken(tokenStorageKey);
			if (result) {
				await deleteStoredToken(tokenStorageKey);
			}
			else {
				shouldContinue = false; // Stop if no more token parts are found
			}
		}
	};

	const runTokenEdit = (edit: () => Promise<void>): Promise<void> => {
		const done = tokenEdits.current.then(edit);
		tokenEdits.current = done.catch((): void => undefined);
		return done;
	};

	const clearToken = (): Promise<void> => runTokenEdit(clearStoredToken);

	const saveToken = (token: AuthToken): Promise<void> => runTokenEdit(async (): Promise<void> => {
		console.debug("Saving token");

		if (!token) {
			console.warn("Attempted to save an empty token.");
			return;
		}

		await clearStoredToken();

		const tokenString = token.toJsonString();

		let tokenParts = tokenString.match(/.{1,2048}/g); // Split the token into parts of 2048 characters each

		if (!tokenParts) {
			tokenParts = [tokenString]; // If the token is shorter than 2048 characters, store it as a single part
		}

		for (let i = 0; i < tokenParts.length; i++) {
			const tokenStorageKey = `${TOKEN_STORAGE_KEY_TEMPLATE}${i + 1}`;
			await writeStoredToken(tokenStorageKey, tokenParts[i]);
		}
	});

	const startAuthenticationFlow = async (onStateChange: (newState: AuthStateEnum) => void): Promise<void> => {
		const authToken = await loadStoredToken();
		if (!authToken) {
			console.log("No token found, setting state to NO_TOKEN");
			onStateChange(AuthStateEnum.NO_TOKEN);
			return;
		}

		if (await authToken.refreshIfNeeded()) {
			console.debug("Token refreshed successfully");
			await saveToken(authToken); // Save the refreshed token
		}

		if (await collisionBlocks(authToken)) {
			onStateChange(AuthStateEnum.ACCOUNT_COLLISION);
			return;
		}

		await WebSocketClient.getInstance().init(authToken, onStateChange, saveToken, clearToken)
			.catch(error => {
				console.error("Failed to initialize WebSocketClient:", error);
				if (currentState.current === AuthStateEnum.CONNECTING) {
					onStateChange(AuthStateEnum.CONNECTION_ERROR);
				}
			});
	};

	const returnToLogin = (): void => {
		WebSocketClient.getInstance().disconnect();
		collectorsStore.reset();
		reportEventStore.reset();
		fightStore.reset();
		resetRootTo(ROOT_SCREENS.LOGIN);
	};

	// Happens when the connection cannot be established
	const restartAuthentication = (onStateChange: (newState: AuthStateEnum) => void): void => {
		startAuthenticationFlow(onStateChange).then()
			.catch(err => {
				console.error("Error during authentication flow restart:", err);
				onStateChange(AuthStateEnum.NO_TOKEN);
			});
		router.replace("/");
	};

	const setStateInternal = (newState: AuthStateEnum): void => {
		const previousState = currentState.current;
		currentState.current = newState;
		setState(newState);
		console.log("Auth state changed from", previousState, "to", newState);

		if (newState === AuthStateEnum.LOGGED_IN && !SESSION_STATES.has(previousState)) {
			resetRootTo(ROOT_SCREENS.GAME);
		}
		else if (LOGIN_STATES.has(newState)) {
			returnToLogin();
		}
		else if (newState === AuthStateEnum.NOT_READY) {
			restartAuthentication(setStateInternal);
		}
	};

	useEffect(() => {
		startAuthenticationFlow(setStateInternal)
			.then()
			.catch(error => {
				console.error("Error during authentication flow:", error);
				setStateInternal(AuthStateEnum.NO_TOKEN);
			});
	}, []);

	useEffect(() => cancelPendingNavigation, []);

	return (
		<AuthContext.Provider value={{
			state, setState: setStateInternal, saveToken, clearToken
		}}>
			{children}
		</AuthContext.Provider>
	);
}
