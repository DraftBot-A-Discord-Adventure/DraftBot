import React from "react";
import { AppState } from "react-native";
import {
	act, fireEvent, render, screen, waitFor, within
} from "@testing-library/react-native";
import { AccountCollisionScreen } from "@/src/authentication/AccountCollisionScreen";
import { AuthContext } from "@/src/authentication/AuthContext";
import { AuthStateEnum } from "@/src/authentication/AuthStateEnum";
import { AuthToken } from "@/src/authentication/AuthToken";
import { KeycloakAuth } from "@/src/authentication/KeycloakAuth";
import {
	AUTH_FAILURES, AuthFailure
} from "@/src/authentication/AuthFailure";
import {
	AccountCollisionRequestFailure, RestApi
} from "@/src/networking/RestApi";
import {
	ACCOUNT_COLLISION_CHOICES, ACCOUNT_COLLISION_ERRORS, AccountCollisionCheck
} from "ws-packets/src/objects/AccountCollision";

jest.mock("expo-router", () => ({ useRouter: (): object => ({ replace: jest.fn() }) }));
jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));
jest.mock("@/src/networking/RestApi", () => ({
	...jest.requireActual<typeof import("@/src/networking/RestApi")>("@/src/networking/RestApi"),
	RestApi: {
		verifyAccountCollision: jest.fn(), resolveAccountCollision: jest.fn(), checkAccountCollision: jest.fn()
	}
}));
jest.mock("@/src/authentication/KeycloakAuth", () => ({
	IDENTITY_PROVIDERS: { DISCORD: "discord" },
	ACCOUNT_ACTION_OUTCOMES: {
		PENDING: "pending", UPDATED: "updated", CANCELLED: "cancelled"
	},
	KeycloakAuth: {
		login: jest.fn(), loginAs: jest.fn(), refresh: jest.fn(), changeEmail: jest.fn()
	}
}));
jest.mock("@/src/translations/i18n", () => ({ i18n: { t: (key: string, options?: object): string => options ? `${key} ${JSON.stringify(options)}` : key } }));

const collision = {
	email: "same@example.test",
	discord: {
		name: "Historical hero",
		createdAt: Date.UTC(2021, 2, 12),
		adventure: {
			level: 42, score: 12_345, classId: 7
		}
	},
	emailAccount: {
		name: "New hero", createdAt: Date.UTC(2026, 8, 30)
	}
};
const saveToken = jest.fn().mockResolvedValue(undefined);
const authenticated = jest.fn().mockResolvedValue(undefined);

function token(accessToken: string): AuthToken {
	return new AuthToken({
		accessToken, refreshToken: "synthetic-refresh", accessTokenExpiresAt: new Date(Date.now() + 60_000), refreshTokenExpiresAt: "never"
	});
}

function keycloakLogin(accessToken: string): Awaited<ReturnType<typeof KeycloakAuth.login>> {
	return {
		access_token: accessToken, refresh_token: "synthetic-refresh", expires_in: 300, refresh_expires_in: 0, token_type: "Bearer", session_state: "test-session", scope: "openid"
	};
}

/** Presses « keep this account » on the card of `kind` */
async function keep(kind: string): Promise<void> {
	await fireEvent.press(within(screen.getByTestId(`collision-account-${kind}`)).getByText("app:auth.collision.keep"));
}

async function renderCollision(check: AccountCollisionCheck = {
	collision, current: ACCOUNT_COLLISION_CHOICES.DISCORD
}, primary = "discord-access"): Promise<void> {
	const auth: React.ContextType<typeof AuthContext> = {
		state: AuthStateEnum.NO_TOKEN, setState: jest.fn(), saveToken, clearToken: jest.fn().mockResolvedValue(undefined)
	};
	await render(<AuthContext.Provider value={auth}><AccountCollisionScreen state={{
		token: token(primary), check
	}} onAuthenticated={authenticated} onCancel={jest.fn()} /></AuthContext.Provider>);
}

describe("account collision choice", () => {
	afterEach(() => {
		jest.restoreAllMocks();
		jest.useRealTimers();
	});

	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(KeycloakAuth.login).mockResolvedValue(keycloakLogin("email-access"));
		jest.mocked(KeycloakAuth.loginAs).mockResolvedValue(keycloakLogin("email-access"));
		jest.mocked(RestApi.verifyAccountCollision).mockResolvedValue({
			proof: "verified-proof", collision
		});
		jest.mocked(RestApi.resolveAccountCollision).mockResolvedValue({ kept: ACCOUNT_COLLISION_CHOICES.DISCORD });
		jest.mocked(RestApi.checkAccountCollision).mockResolvedValue({
			collision, current: ACCOUNT_COLLISION_CHOICES.DISCORD
		});
	});

	it("shows both accounts with what tells them apart, without touching either", async () => {
		await renderCollision();
		const discord = within(screen.getByTestId("collision-account-discord"));
		const email = within(screen.getByTestId("collision-account-email"));
		expect(discord.getByText("Historical hero")).toBeTruthy();
		expect(discord.getByText("app:auth.collision.current")).toBeTruthy();
		expect(discord.getByText("42")).toBeTruthy();
		expect(email.getByText("New hero")).toBeTruthy();
		expect(email.queryByText("app:auth.collision.current")).toBeNull();
		expect(email.getByText("app:auth.collision.noAdventure")).toBeTruthy();
		expect(screen.getByText("app:auth.collision.keepBoth.explanation")).toBeTruthy();
		expect(RestApi.resolveAccountCollision).not.toHaveBeenCalled();
		expect(saveToken).not.toHaveBeenCalled();
	});

	it("deletes nothing when the player backs out of the second sign-in", async () => {
		jest.mocked(KeycloakAuth.loginAs).mockRejectedValueOnce(new AuthFailure(AUTH_FAILURES.CANCELLED, "closed"));
		await renderCollision();
		await keep("email");
		await waitFor(() => expect(KeycloakAuth.loginAs).toHaveBeenCalledTimes(1));
		expect(RestApi.verifyAccountCollision).not.toHaveBeenCalled();
		expect(RestApi.resolveAccountCollision).not.toHaveBeenCalled();
		expect(saveToken).not.toHaveBeenCalled();
		expect(screen.getByTestId("collision-account-discord")).toBeTruthy();
	});

	it.each([
		{
			choice: ACCOUNT_COLLISION_CHOICES.DISCORD, access: "discord-access"
		},
		{
			choice: ACCOUNT_COLLISION_CHOICES.EMAIL, access: "email-access"
		}
	])("keeps exactly the account whose button was pressed ($choice)", async ({
		choice, access
	}) => {
		await renderCollision();
		await keep(choice);
		await waitFor(() => expect(authenticated).toHaveBeenCalledTimes(1));
		expect(KeycloakAuth.loginAs).toHaveBeenCalledWith(collision.email);
		expect(RestApi.verifyAccountCollision).toHaveBeenCalledWith("discord-access", "email-access");
		expect(RestApi.resolveAccountCollision).toHaveBeenCalledWith(access, "verified-proof", choice);
		expect(saveToken).toHaveBeenCalledTimes(1);
		expect((saveToken.mock.calls[0][0] as AuthToken).getAccessToken()).toBe(access);
	});

	it("authenticates Discord as the second account when starting from email", async () => {
		jest.mocked(KeycloakAuth.login).mockResolvedValueOnce(keycloakLogin("discord-access"));
		await renderCollision({
			collision, current: ACCOUNT_COLLISION_CHOICES.EMAIL
		}, "email-access");
		expect(within(screen.getByTestId("collision-account-email")).getByText("app:auth.collision.current")).toBeTruthy();
		await keep(ACCOUNT_COLLISION_CHOICES.EMAIL);
		await waitFor(() => expect(authenticated).toHaveBeenCalledTimes(1));
		expect(KeycloakAuth.login).toHaveBeenCalledWith("discord");
		expect(KeycloakAuth.loginAs).not.toHaveBeenCalled();
		expect(RestApi.verifyAccountCollision).toHaveBeenCalledWith("discord-access", "email-access");
		expect(RestApi.resolveAccountCollision).toHaveBeenCalledWith("email-access", "verified-proof", ACCOUNT_COLLISION_CHOICES.EMAIL);
	});

	it("resumes the already-confirmed choice after interruption instead of offering another account", async () => {
		await renderCollision({
			collision: null, pending: ACCOUNT_COLLISION_CHOICES.EMAIL
		}, "email-access");
		expect(screen.queryByText("app:auth.collision.keep")).toBeNull();
		await fireEvent.press(screen.getByText("app:auth.collision.resume"));
		await waitFor(() => expect(authenticated).toHaveBeenCalledTimes(1));
		expect(KeycloakAuth.login).not.toHaveBeenCalled();
		expect(RestApi.resolveAccountCollision).toHaveBeenCalledWith("email-access", "", ACCOUNT_COLLISION_CHOICES.EMAIL);
	});

	it("opens the restored account when another device already settled the collision", async () => {
		await renderCollision({ collision: null });
		await waitFor(() => expect(authenticated).toHaveBeenCalledTimes(1));
		expect((authenticated.mock.calls[0][0] as AuthToken).getAccessToken()).toBe("discord-access");
		expect(RestApi.resolveAccountCollision).not.toHaveBeenCalled();
		expect(KeycloakAuth.login).not.toHaveBeenCalled();
		expect(KeycloakAuth.loginAs).not.toHaveBeenCalled();
		expect(screen.queryByText("app:auth.collision.resumeNote")).toBeNull();
	});

	it("can retry opening an already-settled account without repeating a destructive choice", async () => {
		authenticated.mockRejectedValueOnce(new Error("Connection unavailable"));
		await renderCollision({ collision: null });
		await waitFor(() => expect(screen.getByText("app:auth.collision.errors.unavailable")).toBeTruthy());
		expect(authenticated).toHaveBeenCalledTimes(1);
		await fireEvent.press(screen.getByText("app:common.continue"));
		await waitFor(() => expect(authenticated).toHaveBeenCalledTimes(2));
		expect(RestApi.resolveAccountCollision).not.toHaveBeenCalled();
	});

	it("does not offer a different choice after a confirmed resolution fails", async () => {
		jest.mocked(RestApi.resolveAccountCollision).mockRejectedValueOnce(new AccountCollisionRequestFailure(ACCOUNT_COLLISION_ERRORS.UNAVAILABLE));
		await renderCollision();
		await keep(ACCOUNT_COLLISION_CHOICES.DISCORD);
		await waitFor(() => expect(screen.getByText("app:auth.collision.errors.unavailable")).toBeTruthy());
		expect(screen.queryByText("app:auth.collision.keep")).toBeNull();
		expect(authenticated).not.toHaveBeenCalled();
		await fireEvent.press(screen.getByText("app:auth.collision.resume"));
		await waitFor(() => expect(authenticated).toHaveBeenCalledTimes(1));
		expect(RestApi.resolveAccountCollision).toHaveBeenLastCalledWith("discord-access", "verified-proof", ACCOUNT_COLLISION_CHOICES.DISCORD);
	});

	it("offers both accounts again if the proof expires before any choice was started on the server", async () => {
		jest.mocked(RestApi.resolveAccountCollision).mockRejectedValueOnce(new AccountCollisionRequestFailure(ACCOUNT_COLLISION_ERRORS.PROOF_EXPIRED));
		await renderCollision();
		await keep(ACCOUNT_COLLISION_CHOICES.DISCORD);
		await waitFor(() => expect(screen.getByText("app:auth.collision.errors.proofExpired")).toBeTruthy());
		expect(screen.getAllByText("app:auth.collision.keep")).toHaveLength(2);
		expect(screen.getByText("app:common.back")).toBeTruthy();
		expect(screen.queryByText("app:auth.collision.resume")).toBeNull();
		expect(authenticated).not.toHaveBeenCalled();
	});

	it("lets the player in with both accounts once the email account has another address", async () => {
		jest.mocked(KeycloakAuth.changeEmail).mockResolvedValueOnce("pending");
		jest.mocked(RestApi.checkAccountCollision).mockResolvedValueOnce({ collision: null });
		await renderCollision();
		await fireEvent.press(screen.getByText("app:auth.collision.keepBoth.action"));
		await waitFor(() => expect(authenticated).toHaveBeenCalledTimes(1));
		expect(KeycloakAuth.changeEmail).toHaveBeenCalledWith(collision.email);
		expect((authenticated.mock.calls[0][0] as AuthToken).getAccessToken()).toBe("discord-access");
		expect(RestApi.resolveAccountCollision).not.toHaveBeenCalled();
	});

	it("waits for the confirmation link while the new address is not confirmed yet", async () => {
		jest.mocked(KeycloakAuth.changeEmail).mockResolvedValueOnce("pending");
		await renderCollision();
		await fireEvent.press(screen.getByText("app:auth.collision.keepBoth.action"));
		await waitFor(() => expect(screen.getByText("app:auth.collision.keepBoth.awaitingLink")).toBeTruthy());
		await waitFor(() => expect(RestApi.checkAccountCollision).toHaveBeenCalledWith("discord-access"));
		expect(authenticated).not.toHaveBeenCalled();
	});

	it("does not start watching or notify a failure when the email change is cancelled", async () => {
		jest.useFakeTimers();
		jest.mocked(KeycloakAuth.changeEmail).mockResolvedValueOnce("cancelled");
		await renderCollision();
		await fireEvent.press(screen.getByText("app:auth.collision.keepBoth.action"));
		await act(async (): Promise<void> => {
			await jest.advanceTimersByTimeAsync(12_000);
		});
		expect(RestApi.checkAccountCollision).not.toHaveBeenCalled();
		expect(screen.queryByText("app:auth.collision.keepBoth.awaitingLink")).toBeNull();
		expect(screen.queryByText("app:auth.collision.keepBoth.failed")).toBeNull();
	});

	it("recovers from a temporary collision recheck failure", async () => {
		jest.useFakeTimers();
		jest.mocked(KeycloakAuth.changeEmail).mockResolvedValueOnce("pending");
		jest.mocked(RestApi.checkAccountCollision).mockRejectedValueOnce(new AccountCollisionRequestFailure(ACCOUNT_COLLISION_ERRORS.UNAVAILABLE));
		await renderCollision();
		await fireEvent.press(screen.getByText("app:auth.collision.keepBoth.action"));
		await act(async (): Promise<void> => {
			await Promise.resolve();
		});
		expect(screen.getByText("app:auth.collision.errors.unavailable")).toBeTruthy();
		jest.mocked(RestApi.checkAccountCollision).mockResolvedValue({ collision: null });
		await act(async (): Promise<void> => {
			await jest.advanceTimersByTimeAsync(4_000);
		});
		expect(authenticated).toHaveBeenCalledTimes(1);
		expect(screen.queryByText("app:auth.collision.errors.unavailable")).toBeNull();
	});

	it("notices a link confirmed on another device while the app stays open", async () => {
		jest.useFakeTimers();
		jest.mocked(KeycloakAuth.changeEmail).mockResolvedValueOnce("pending");
		await renderCollision();
		await fireEvent.press(screen.getByText("app:auth.collision.keepBoth.action"));
		await act(async (): Promise<void> => {
			await Promise.resolve();
		});
		expect(RestApi.checkAccountCollision).toHaveBeenCalledTimes(1);
		jest.mocked(RestApi.checkAccountCollision).mockResolvedValue({ collision: null });
		await act(async (): Promise<void> => {
			await jest.advanceTimersByTimeAsync(4_000);
		});
		expect(authenticated).toHaveBeenCalledTimes(1);
		expect(RestApi.resolveAccountCollision).not.toHaveBeenCalled();
	});

	it("pauses rechecks in the background and checks immediately on returning", async () => {
		jest.useFakeTimers();
		const originalState = AppState.currentState;
		const subscriptions = jest.spyOn(AppState, "addEventListener");
		Reflect.set(AppState, "currentState", "background");
		try {
			jest.mocked(KeycloakAuth.changeEmail).mockResolvedValueOnce("pending");
			await renderCollision();
			await fireEvent.press(screen.getByText("app:auth.collision.keepBoth.action"));
			await act(async (): Promise<void> => {
				await jest.advanceTimersByTimeAsync(4_000);
			});
			expect(RestApi.checkAccountCollision).not.toHaveBeenCalled();
			Reflect.set(AppState, "currentState", "active");
			await act(async (): Promise<void> => {
				subscriptions.mock.calls.at(-1)?.[1]("active");
			});
			expect(RestApi.checkAccountCollision).toHaveBeenCalledTimes(1);
		}
		finally {
			Reflect.set(AppState, "currentState", originalState);
		}
	});

	it("keeps a failed session opening retryable when the parent callback changes", async () => {
		let rejectOpening!: (error: Error) => void;
		authenticated.mockReturnValueOnce(new Promise<void>((_resolve, reject) => {
			rejectOpening = reject;
		}));
		const state = {
			token: token("discord-access"),
			check: {
				collision, current: ACCOUNT_COLLISION_CHOICES.DISCORD
			}
		};
		jest.mocked(KeycloakAuth.changeEmail).mockResolvedValueOnce("pending");
		jest.mocked(RestApi.checkAccountCollision).mockResolvedValueOnce({ collision: null });
		await render(<AccountCollisionScreen state={state} onAuthenticated={authenticated} onCancel={jest.fn()} />);
		await fireEvent.press(screen.getByText("app:auth.collision.keepBoth.action"));
		await waitFor(() => expect(authenticated).toHaveBeenCalledTimes(1));
		await screen.rerender(<AccountCollisionScreen state={state} onAuthenticated={jest.fn()} onCancel={jest.fn()} />);
		await act(async (): Promise<void> => {
			rejectOpening(new Error("Connection unavailable"));
		});
		expect(screen.getByText("app:auth.collision.errors.unavailable")).toBeTruthy();
		expect(screen.getByRole("button", {
			name: "app:common.back", disabled: false
		})).toBeTruthy();
	});

	it("does not overlap collision rechecks while a previous response is pending", async () => {
		jest.useFakeTimers();
		jest.mocked(KeycloakAuth.changeEmail).mockResolvedValueOnce("pending");
		jest.mocked(RestApi.checkAccountCollision).mockReturnValueOnce(new Promise(() => undefined));
		await renderCollision();
		await fireEvent.press(screen.getByText("app:auth.collision.keepBoth.action"));
		await act(async (): Promise<void> => {
			await jest.advanceTimersByTimeAsync(12_000);
		});
		expect(RestApi.checkAccountCollision).toHaveBeenCalledTimes(1);
		expect(authenticated).not.toHaveBeenCalled();
	});

	it("ignores a pending collision response after leaving the screen", async () => {
		let finish!: (check: AccountCollisionCheck) => void;
		jest.mocked(KeycloakAuth.changeEmail).mockResolvedValueOnce("pending");
		jest.mocked(RestApi.checkAccountCollision).mockReturnValueOnce(new Promise(resolve => {
			finish = resolve;
		}));
		await renderCollision();
		await fireEvent.press(screen.getByText("app:auth.collision.keepBoth.action"));
		await waitFor(() => expect(RestApi.checkAccountCollision).toHaveBeenCalledTimes(1));
		await screen.unmount();
		await act(async (): Promise<void> => {
			finish({ collision: null });
		});
		expect(authenticated).not.toHaveBeenCalled();
	});

	it("does not let a stale email-watching response replace the chosen account", async () => {
		let finishCheck!: (check: AccountCollisionCheck) => void;
		let finishLogin!: () => void;
		jest.mocked(KeycloakAuth.changeEmail).mockResolvedValueOnce("pending");
		jest.mocked(RestApi.checkAccountCollision).mockReturnValueOnce(new Promise(resolve => {
			finishCheck = resolve;
		}));
		jest.mocked(KeycloakAuth.loginAs).mockReturnValueOnce(new Promise(resolve => {
			finishLogin = (): void => resolve(keycloakLogin("email-access"));
		}));
		await renderCollision();
		await fireEvent.press(screen.getByText("app:auth.collision.keepBoth.action"));
		await waitFor(() => expect(RestApi.checkAccountCollision).toHaveBeenCalledTimes(1));
		await keep(ACCOUNT_COLLISION_CHOICES.EMAIL);
		await act(async (): Promise<void> => {
			finishCheck({ collision: null });
		});
		expect(authenticated).not.toHaveBeenCalled();
		await act(async (): Promise<void> => {
			finishLogin();
		});
		await waitFor(() => expect(authenticated).toHaveBeenCalledTimes(1));
		expect((authenticated.mock.calls[0][0] as AuthToken).getAccessToken()).toBe("email-access");
		expect(RestApi.resolveAccountCollision).toHaveBeenCalledWith("email-access", "verified-proof", ACCOUNT_COLLISION_CHOICES.EMAIL);
	});

	it("opens the kept account when the server finished but its first response was lost", async () => {
		jest.mocked(RestApi.resolveAccountCollision).mockRejectedValueOnce(new AccountCollisionRequestFailure(ACCOUNT_COLLISION_ERRORS.PROOF_EXPIRED));
		jest.mocked(RestApi.checkAccountCollision).mockResolvedValueOnce({ collision: null });
		await renderCollision({
			collision: null, pending: ACCOUNT_COLLISION_CHOICES.EMAIL
		}, "email-access");
		await fireEvent.press(screen.getByText("app:auth.collision.resume"));
		await waitFor(() => expect(authenticated).toHaveBeenCalledTimes(1));
		expect(RestApi.checkAccountCollision).toHaveBeenCalledWith("email-access");
		expect(RestApi.resolveAccountCollision).toHaveBeenCalledTimes(1);
	});

	it("does not send a second confirmation while resolution is pending", async () => {
		let finish!: () => void;
		jest.mocked(RestApi.resolveAccountCollision).mockReturnValueOnce(new Promise(resolve => {
			finish = (): void => resolve({ kept: ACCOUNT_COLLISION_CHOICES.DISCORD });
		}));
		await renderCollision({
			collision: null, pending: ACCOUNT_COLLISION_CHOICES.DISCORD
		});
		await fireEvent.press(screen.getByText("app:auth.collision.resume"));
		await waitFor(() => expect(RestApi.resolveAccountCollision).toHaveBeenCalledTimes(1));
		await fireEvent.press(screen.getByText("app:auth.collision.resume"));
		expect(RestApi.resolveAccountCollision).toHaveBeenCalledTimes(1);
		await act(async (): Promise<void> => {
			finish();
		});
	});
});
