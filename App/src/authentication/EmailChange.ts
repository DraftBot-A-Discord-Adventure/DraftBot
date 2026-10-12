import {
	useCallback, useEffect, useRef, useState
} from "react";
import { AppState } from "react-native";
import {
	EMAIL_CHANGE_OUTCOMES, KeycloakAuth
} from "@/src/authentication/KeycloakAuth";
import { WebSocketClient } from "@/src/networking/WebSocketClient";

export type EmailChange = {

	/** The address of the account, unknown until Keycloak answered. */
	email: string | null;
	changing: boolean;

	/** A confirmation link waits on the new address, so the shown one has not changed yet. */
	awaitingLink: boolean;
	failed: boolean;
	change: () => void;
};

async function readAccountEmail(): Promise<string | null> {
	const accessToken = await WebSocketClient.getInstance().getCurrentAccessToken();
	return accessToken ? KeycloakAuth.accountEmail(accessToken) : null;
}

/**
 * The account address and the way to change it.
 *
 * The change is confirmed from a mail, usually in the phone's browser: the address is read again
 * each time the player comes back to the game.
 */
export function useEmailChange(): EmailChange {
	const [email, setEmail] = useState<string | null>(null);
	const [changing, setChanging] = useState(false);
	const [failed, setFailed] = useState(false);
	const [linkSentFrom, setLinkSentFrom] = useState<string | null>(null);
	const running = useRef(false);

	const refresh = useCallback((): void => {
		readAccountEmail().then(setEmail)
			.catch((error: unknown) => console.warn("Account email not read:", error));
	}, []);

	useEffect(() => {
		refresh();
		const subscription = AppState.addEventListener("change", state => {
			if (state === "active") {
				refresh();
			}
		});
		return (): void => subscription.remove();
	}, [refresh]);

	const change = useCallback((): void => {
		if (running.current) {
			return;
		}
		running.current = true;
		setChanging(true);
		setFailed(false);
		KeycloakAuth.changeEmail()
			.then(outcome => {
				if (outcome === EMAIL_CHANGE_OUTCOMES.PENDING) {
					setLinkSentFrom(email);
				}
				refresh();
			})
			.catch((error: unknown) => {
				console.warn("Email change failed:", error);
				setFailed(true);
			})
			.finally(() => {
				running.current = false;
				setChanging(false);
			});
	}, [email, refresh]);

	return {
		email,
		changing,
		awaitingLink: linkSentFrom !== null && linkSentFrom === email,
		failed,
		change
	};
}
