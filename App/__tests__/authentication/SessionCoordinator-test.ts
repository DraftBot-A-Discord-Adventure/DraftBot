import { SessionCoordinator, SessionStorage } from "@/src/authentication/SessionCoordinator";
import { AuthToken } from "@/src/authentication/AuthToken";
import { AuthStateEnum } from "@/src/authentication/AuthStateEnum";
import { RestApi } from "@/src/networking/RestApi";
import { AUTH_FAILURES, AuthFailure } from "@/src/authentication/AuthFailure";
import { ACCOUNT_ACTION_OUTCOMES, KeycloakAuth } from "@/src/authentication/KeycloakAuth";

jest.mock("@/src/networking/RestApi", () => ({
	isAccountCollisionOpen: (check: {collision: unknown; pending?: string}): boolean => Boolean(check.collision || check.pending),
	RestApi: {checkAccountCollision: jest.fn()}
}));

function token(): AuthToken {
	return new AuthToken({accessToken: "session-access", refreshToken: "session-refresh", accessTokenExpiresAt: new Date(Date.now() + 60_000), refreshTokenExpiresAt: "never"});
}

describe("session coordinator", () => {
	beforeEach(() => jest.clearAllMocks());
	afterEach(() => jest.restoreAllMocks());

	it("uses the same admission path for a login and a restored session", async () => {
		const current = token();
		const storage: SessionStorage = {read: jest.fn().mockResolvedValue(current), save: jest.fn().mockResolvedValue(undefined), clear: jest.fn().mockResolvedValue(undefined)};
		const connection = {open: jest.fn().mockResolvedValue(undefined), close: jest.fn()};
		const events = {state: jest.fn(), collision: jest.fn()};
		jest.mocked(RestApi.checkAccountCollision).mockResolvedValue({collision: null});
		const session = new SessionCoordinator(storage, connection, events);
		await session.restore();
		await session.enter(current);
		expect(connection.open).toHaveBeenCalledTimes(2);
		expect(RestApi.checkAccountCollision).toHaveBeenCalledTimes(2);
	});

	it("keeps the stored session on a temporary admission failure", async () => {
		const storage: SessionStorage = {read: jest.fn().mockResolvedValue(token()), save: jest.fn().mockResolvedValue(undefined), clear: jest.fn().mockResolvedValue(undefined)};
		const connection = {open: jest.fn(), close: jest.fn()};
		const events = {state: jest.fn(), collision: jest.fn()};
		jest.mocked(RestApi.checkAccountCollision).mockRejectedValue(new TypeError("Network unavailable"));
		await new SessionCoordinator(storage, connection, events).restore();
		expect(storage.clear).not.toHaveBeenCalled();
		expect(connection.open).not.toHaveBeenCalled();
		expect(events.state).toHaveBeenLastCalledWith(AuthStateEnum.CONNECTION_ERROR);
	});

	it("never opens the socket when secure session persistence fails", async () => {
		const storage: SessionStorage = {read: jest.fn(), save: jest.fn().mockRejectedValue(new Error("keychain unavailable")), clear: jest.fn()};
		const connection = {open: jest.fn(), close: jest.fn()};
		const events = {state: jest.fn(), collision: jest.fn()};
		await expect(new SessionCoordinator(storage, connection, events).enter(token())).rejects.toThrow("keychain unavailable");
		expect(connection.open).not.toHaveBeenCalled();
	});

	it("does not reopen a session after logout while admission is pending", async () => {
		let finish!: (check: {collision: null}) => void;
		const storage: SessionStorage = {read: jest.fn().mockResolvedValue(token()), save: jest.fn().mockResolvedValue(undefined), clear: jest.fn().mockResolvedValue(undefined)};
		const connection = {open: jest.fn(), close: jest.fn()};
		const events = {state: jest.fn(), collision: jest.fn()};
		jest.mocked(RestApi.checkAccountCollision).mockReturnValue(new Promise(resolve => {finish = resolve;}));
		const session = new SessionCoordinator(storage, connection, events);
		const restoring = session.restore();
		while (!finish) {
			await Promise.resolve();
		}
		await session.leave();
		finish({collision: null});
		await restoring;
		expect(connection.open).not.toHaveBeenCalled();
		expect(events.state).toHaveBeenLastCalledWith(AuthStateEnum.NO_TOKEN);
	});

	it("shares token rotation and retries persistence before exposing a rotated access token", async () => {
		const current = token();
		const storage: SessionStorage = {read: jest.fn(), save: jest.fn().mockResolvedValue(undefined), clear: jest.fn()};
		const session = new SessionCoordinator(storage, {open: jest.fn(), close: jest.fn()}, {state: jest.fn(), collision: jest.fn()});
		jest.mocked(RestApi.checkAccountCollision).mockResolvedValue({collision: null});
		await session.enter(current);
		jest.spyOn(current, "getAccessToken").mockReturnValue("rotated-access");
		jest.spyOn(current, "toJsonString").mockReturnValue("rotated-session");
		jest.mocked(storage.save).mockRejectedValueOnce(new Error("keychain unavailable"));
		const first = session.accessToken();
		expect(session.accessToken()).toBe(first);
		await expect(first).rejects.toThrow("keychain unavailable");
		await expect(session.accessToken()).resolves.toBe("rotated-access");
		expect(storage.save).toHaveBeenCalledTimes(3);
	});

	it("persists a token rotated by a collision flow before reusing its access", async () => {
		jest.useFakeTimers();
		try {
			const current = token();
			const saved: string[] = [];
			const storage: SessionStorage = {read: jest.fn(), save: jest.fn(async tokenToSave => {saved.push(tokenToSave.toJsonString());}), clear: jest.fn()};
			const session = new SessionCoordinator(storage, {open: jest.fn(), close: jest.fn()}, {state: jest.fn(), collision: jest.fn()});
			jest.mocked(RestApi.checkAccountCollision).mockResolvedValue({collision: null});
			await session.enter(current);
			jest.spyOn(KeycloakAuth, "refresh").mockResolvedValue({access_token: "rotated-access", refresh_token: "rotated-refresh", expires_in: 300, refresh_expires_in: 0, token_type: "Bearer", session_state: "session", scope: "openid offline_access"});
			jest.advanceTimersByTime(61_000);
			await current.refreshIfNeeded();
			await expect(session.accessToken()).resolves.toBe("rotated-access");
			expect(saved).toHaveLength(2);
			expect(saved[0]).not.toBe(saved[1]);
			expect(AuthToken.fromJsonString(saved[1])?.getAccessToken()).toBe("rotated-access");
		}
		finally {
			jest.useRealTimers();
		}
	});

	it("does not reuse a refresh from the previous account", async () => {
		const previous = token();
		const storage: SessionStorage = {read: jest.fn(), save: jest.fn().mockResolvedValue(undefined), clear: jest.fn()};
		const session = new SessionCoordinator(storage, {open: jest.fn(), close: jest.fn()}, {state: jest.fn(), collision: jest.fn()});
		jest.mocked(RestApi.checkAccountCollision).mockResolvedValue({collision: null});
		await session.enter(previous);
		let finish!: (refreshed: boolean) => void;
		jest.spyOn(previous, "refreshIfNeeded").mockReturnValue(new Promise(resolve => {finish = resolve;}));
		const stale = session.accessToken();
		const current = new AuthToken({accessToken: "new-account", refreshToken: "new-refresh", accessTokenExpiresAt: new Date(Date.now() + 60_000), refreshTokenExpiresAt: "never"});
		await session.enter(current);
		await expect(session.accessToken()).resolves.toBe("new-account");
		finish(true);
		await expect(stale).resolves.toBeNull();
	});

	it("clears permanently rejected tokens without opening a socket", async () => {
		const current = token();
		jest.spyOn(current, "refreshIfNeeded").mockRejectedValue(new AuthFailure(AUTH_FAILURES.INVALID_TOKEN, "refresh rejected"));
		const storage: SessionStorage = {read: jest.fn().mockResolvedValue(current), save: jest.fn(), clear: jest.fn().mockResolvedValue(undefined)};
		const connection = {open: jest.fn(), close: jest.fn()};
		const events = {state: jest.fn(), collision: jest.fn()};
		await new SessionCoordinator(storage, connection, events).restore();
		expect(connection.open).not.toHaveBeenCalled();
		expect(storage.clear).toHaveBeenCalledTimes(1);
		expect(events.state).toHaveBeenLastCalledWith(AuthStateEnum.TOKEN_INVALID_OR_EXPIRED);
	});

	it.each(["changeEmail", "changePassword"] as const)("targets %s at the current authenticated account", async action => {
		const storage: SessionStorage = {read: jest.fn(), save: jest.fn().mockResolvedValue(undefined), clear: jest.fn()};
		const session = new SessionCoordinator(storage, {open: jest.fn(), close: jest.fn()}, {state: jest.fn(), collision: jest.fn()});
		jest.mocked(RestApi.checkAccountCollision).mockResolvedValue({collision: null});
		await session.enter(token());
		const target = {keycloakId: "current-sub", loginHint: "current@example.com"};
		jest.spyOn(KeycloakAuth, "accountIdentity").mockResolvedValue(target);
		const browserAction = jest.spyOn(KeycloakAuth, action).mockResolvedValue(ACCOUNT_ACTION_OUTCOMES.PENDING);
		await session[action]();
		expect(KeycloakAuth.accountIdentity).toHaveBeenCalledWith("session-access");
		expect(browserAction).toHaveBeenCalledWith(target);
	});

	it("does not open a sensitive action after logout while identity is pending", async () => {
		const storage: SessionStorage = {read: jest.fn(), save: jest.fn().mockResolvedValue(undefined), clear: jest.fn().mockResolvedValue(undefined)};
		const session = new SessionCoordinator(storage, {open: jest.fn(), close: jest.fn()}, {state: jest.fn(), collision: jest.fn()});
		jest.mocked(RestApi.checkAccountCollision).mockResolvedValue({collision: null});
		await session.enter(token());
		let finish!: (identity: {keycloakId: string}) => void;
		jest.spyOn(KeycloakAuth, "accountIdentity").mockImplementation(() => new Promise(resolve => {finish = resolve;}));
		const action = jest.spyOn(KeycloakAuth, "changeEmail");
		const pending = session.changeEmail();
		while (!finish) {
			await Promise.resolve();
		}
		await session.leave();
		finish({keycloakId: "old-sub"});
		await expect(pending).resolves.toBe(ACCOUNT_ACTION_OUTCOMES.CANCELLED);
		expect(action).not.toHaveBeenCalled();
	});
});