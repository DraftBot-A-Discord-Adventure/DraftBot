import { AuthToken } from "./AuthToken";
import { AuthStateEnum } from "./AuthStateEnum";
import {
	AUTH_FAILURES, AuthFailure
} from "./AuthFailure";
import {
	isAccountCollisionOpen, RestApi
} from "../networking/RestApi";
import { AccountCollisionCheck } from "ws-packets/src/objects/AccountCollision";
import {
	ACCOUNT_ACTION_OUTCOMES, AccountActionOutcome, AccountTarget, KeycloakAuth
} from "./KeycloakAuth";

export type CollisionSession = {
	token: AuthToken; check: AccountCollisionCheck;
};

export type SessionStorage = {
	read: () => Promise<AuthToken | null>;
	save: (token: AuthToken) => Promise<void>;
	clear: () => Promise<void>;
};

export type SessionConnection = {
	open: (token: AuthToken, onState: (state: AuthStateEnum) => void) => Promise<void>;
	close: () => void;
};

export type SessionEvents = {
	state: (state: AuthStateEnum) => void;
	collision: (session: CollisionSession | null) => void;
};

export class SessionCoordinator {
	private generation = 0;

	private token: AuthToken | null = null;

	private savedToken: string | null = null;

	private accessing: Promise<string | null> | null = null;

	public constructor(private readonly storage: SessionStorage, private readonly connection: SessionConnection, private readonly events: SessionEvents) {
	}

	public async restore(): Promise<void> {
		this.dispose();
		const generation = this.generation;
		try {
			const token = await this.storage.read();
			if (generation !== this.generation) {
				return;
			}
			if (!token) {
				this.events.state(AuthStateEnum.NO_TOKEN);
				return;
			}
			await this.open(token, generation);
		}
		catch (error) {
			await this.failed(error, generation);
		}
	}

	public async enter(token: AuthToken): Promise<void> {
		this.dispose();
		const generation = this.generation;
		try {
			await this.open(token, generation);
		}
		catch (error) {
			await this.failed(error, generation);
			throw error;
		}
	}

	private async open(token: AuthToken, generation: number): Promise<void> {
		this.token = token;
		this.events.state(AuthStateEnum.CONNECTING);
		const access = await this.accessToken();
		if (generation !== this.generation) {
			return;
		}
		if (!access) {
			throw new AuthFailure(AUTH_FAILURES.INVALID_TOKEN, "The stored session has expired.");
		}
		const check = await RestApi.checkAccountCollision(access);
		if (generation !== this.generation) {
			return;
		}
		if (isAccountCollisionOpen(check)) {
			this.events.collision({
				token, check
			});
			this.events.state(AuthStateEnum.ACCOUNT_COLLISION);
			return;
		}
		this.events.collision(null);
		await this.connection.open(token, state => {
			if (generation === this.generation) {
				this.connectionState(state, generation);
			}
		});
	}

	private connectionState(state: AuthStateEnum, generation: number): void {
		if (state === AuthStateEnum.ACCOUNT_COLLISION && this.token) {
			this.enter(this.token).catch((): void => undefined);
		}
		else if (state === AuthStateEnum.TOKEN_INVALID_OR_EXPIRED) {
			this.failed(new AuthFailure(AUTH_FAILURES.INVALID_TOKEN, "The session was rejected."), generation).catch((): void => undefined);
		}
		else {
			this.events.state(state);
		}
	}

	private async failed(error: unknown, generation: number): Promise<void> {
		if (generation !== this.generation) {
			return;
		}
		if (error instanceof AuthFailure && error.reason === AUTH_FAILURES.INVALID_TOKEN) {
			this.dispose();
			const clearedGeneration = this.generation;
			await this.storage.clear();
			if (clearedGeneration === this.generation) {
				this.events.collision(null);
				this.events.state(AuthStateEnum.TOKEN_INVALID_OR_EXPIRED);
			}
			return;
		}
		this.events.state(AuthStateEnum.CONNECTION_ERROR);
	}

	public accessToken(): Promise<string | null> {
		if (this.accessing) {
			return this.accessing;
		}
		const generation = this.generation;
		const request = this.currentAccess()
			.catch(async (error: unknown): Promise<string | null> => {
				await this.failed(error, generation);
				throw error;
			})
			.finally((): void => {
				if (this.accessing === request) {
					this.accessing = null;
				}
			});
		this.accessing = request;
		return request;
	}

	private async currentAccess(): Promise<string | null> {
		const token = this.token;
		if (!token) {
			return null;
		}
		const generation = this.generation;
		await token.refreshIfNeeded();
		if (generation !== this.generation) {
			return null;
		}
		if (!token.getAccessToken()) {
			throw new AuthFailure(AUTH_FAILURES.INVALID_TOKEN, "The stored session has expired.");
		}
		const serialized = token.toJsonString();
		if (serialized !== this.savedToken) {
			await this.storage.save(token);
			if (generation !== this.generation) {
				return null;
			}
			this.savedToken = serialized;
		}
		return generation === this.generation ? token.getAccessToken() : null;
	}

	public dispose(): void {
		this.generation++;
		this.token = null;
		this.savedToken = null;
		this.accessing = null;
		this.connection.close();
	}

	public async leave(): Promise<void> {
		this.dispose();
		const generation = this.generation;
		await this.storage.clear();
		if (generation === this.generation) {
			this.events.collision(null);
			this.events.state(AuthStateEnum.NO_TOKEN);
		}
	}

	private async accountTarget(): Promise<AccountTarget | null> {
		const generation = this.generation;
		const access = await this.accessToken();
		if (!access) {
			throw new AuthFailure(AUTH_FAILURES.INVALID_TOKEN, "The current account is unavailable.");
		}
		const target = await KeycloakAuth.accountIdentity(access);
		return generation === this.generation ? target : null;
	}

	public async changeEmail(): Promise<AccountActionOutcome> {
		const target = await this.accountTarget();
		return target ? KeycloakAuth.changeEmail(target) : ACCOUNT_ACTION_OUTCOMES.CANCELLED;
	}

	public async changePassword(): Promise<AccountActionOutcome> {
		const target = await this.accountTarget();
		return target ? KeycloakAuth.changePassword(target) : ACCOUNT_ACTION_OUTCOMES.CANCELLED;
	}
}
