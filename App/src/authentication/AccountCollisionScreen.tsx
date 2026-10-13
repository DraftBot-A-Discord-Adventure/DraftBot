import {
	ReactElement, useCallback, useContext, useEffect, useEffectEvent, useRef, useState
} from "react";
import { AppState } from "react-native";
import { AuthContext } from "@/src/authentication/AuthContext";
import { AuthToken } from "@/src/authentication/AuthToken";
import { KeycloakOAuth2Token } from "@/src/authentication/KeycloakOAuth2Token";
import {
	AUTH_FAILURES, reasonOfUnknownError
} from "@/src/authentication/AuthFailure";
import {
	ACCOUNT_ACTION_OUTCOMES, AccountActionOutcome, IDENTITY_PROVIDERS, KeycloakAuth
} from "@/src/authentication/KeycloakAuth";
import { useAccountAction } from "@/src/authentication/AccountAction";
import { CollisionAccountCard } from "@/src/authentication/CollisionAccountCard";
import {
	AccountCollisionRequestFailure, isAccountCollisionOpen, RestApi
} from "@/src/networking/RestApi";
import {
	Button, ButtonRow, Note, Screen, SectionHeader
} from "@/src/design/Primitives";
import {
	ActionBanner, Card, EntryRow, Refusal, Standing
} from "@/src/design/Sections";
import {
	AtSign, Check
} from "@/src/design/FightIcons";
import { i18n } from "@/src/translations/i18n";
import {
	ACCOUNT_COLLISION_CHOICES, ACCOUNT_COLLISION_ERRORS, AccountCollision, AccountCollisionCheck, AccountCollisionChoice, AccountCollisionError, AccountCollisionProof, CollisionAccount
} from "ws-packets/src/objects/AccountCollision";

const REVERIFIABLE_ERRORS: ReadonlySet<AccountCollisionError> = new Set([ACCOUNT_COLLISION_ERRORS.PROOF_EXPIRED, ACCOUNT_COLLISION_ERRORS.ACCOUNT_CHANGED]);
const KEEP_BOTH_EMBLEM_SIZE = 20;
const COLLISION_RECHECK_MS = 4_000;

export type AccountCollisionLoginState = {
	token: AuthToken; check: AccountCollisionCheck;
};
type VerifiedAccounts = {
	discord: AuthToken; email: AuthToken; proof: AccountCollisionProof;
};

async function accessToken(token: AuthToken): Promise<string> {
	await token.refreshIfNeeded();
	const access = token.getAccessToken();
	if (!access) {
		throw new Error("Account session expired");
	}
	return access;
}

function failureText(error: unknown): string | null {
	if (reasonOfUnknownError(error) === AUTH_FAILURES.CANCELLED) {
		return null;
	}
	if (error instanceof AccountCollisionRequestFailure) {
		return i18n.t(`app:auth.collision.errors.${error.reason}`);
	}
	return i18n.t("app:auth.collision.errors.unavailable");
}

function isReverifiable(error: unknown): boolean {
	return error instanceof AccountCollisionRequestFailure && REVERIFIABLE_ERRORS.has(error.reason);
}

/** Whether the collision outlived a refused resolution: a concurrent one may have settled it already */
async function collisionRemains(kept: AuthToken): Promise<boolean> {
	const current = await RestApi.checkAccountCollision(await accessToken(kept));
	return isAccountCollisionOpen(current);
}

/** The account still to prove: Discord, or the one holding the shared address, typed in for the player */
function signInToOtherAccount(collision: AccountCollision | null, startedFromEmail: boolean): Promise<KeycloakOAuth2Token> {
	if (startedFromEmail) {
		return KeycloakAuth.login(IDENTITY_PROVIDERS.DISCORD);
	}
	return collision ? KeycloakAuth.loginAs(collision.email) : KeycloakAuth.login();
}

/** Signs in to the other account, then proves both belong to the player */
async function verifiedAccounts(state: AccountCollisionLoginState, startedFromEmail: boolean): Promise<VerifiedAccounts> {
	const second = AuthToken.fromKeycloakOAuth2Token(await signInToOtherAccount(state.check.collision, startedFromEmail));
	const [discord, email] = startedFromEmail ? [second, state.token] : [state.token, second];
	const proof = await RestApi.verifyAccountCollision(await accessToken(discord), await accessToken(email));
	return {
		discord, email, proof
	};
}

/** Sends the choice; a stale proof restarts the verification unless the account got settled meanwhile */
async function sendChoice(kept: AuthToken, choice: AccountCollisionChoice, {
	proof, onStale
}: {
	proof: string; onStale: () => void;
}): Promise<void> {
	try {
		await RestApi.resolveAccountCollision(await accessToken(kept), proof, choice);
	}
	catch (error) {
		if (!isReverifiable(error)) {
			throw error;
		}
		if (await collisionRemains(kept)) {
			onStale();
			throw error;
		}
	}
}

/** Runs one task at a time and keeps the last failure to show */
function useExclusiveTask(): {
	pending: boolean; failure: string | null; run: (task: () => Promise<void>) => void;
} {
	const [pending, setPending] = useState(false);
	const [failure, setFailure] = useState<string | null>(null);
	const running = useRef(false);
	const run = useCallback((task: () => Promise<void>): void => {
		if (running.current) {
			return;
		}
		running.current = true;
		setPending(true);
		setFailure(null);
		task().catch((error: unknown): void => setFailure(failureText(error)))
			.finally((): void => {
				running.current = false;
				setPending(false);
			});
	}, []);
	return {
		pending, failure, run
	};
}

function TaskStatus({
	failure, pending
}: {
	failure: string | null; pending: boolean;
}): ReactElement {
	return <>
		{failure ? <Refusal>{failure}</Refusal> : null}
		{pending ? <Note>{i18n.t("app:auth.collision.pending")}</Note> : null}
	</>;
}

type CollisionChoiceFlow = {

	/** The choice reached the server: it can only be finished, never changed. */
	confirmed: boolean;
	choice: AccountCollisionChoice | "";
	pending: boolean;
	failure: string | null;
	keep: (choice: AccountCollisionChoice) => void;
	resume: () => void;
};

/** Keeps the chosen account once the other one is proven too; a choice already confirmed resumes without asking again */
function useCollisionChoice(state: AccountCollisionLoginState, onAuthenticated: (token: AuthToken) => Promise<void>): CollisionChoiceFlow {
	const auth = useContext(AuthContext);
	const [choice, setChoice] = useState<AccountCollisionChoice | "">(state.check.pending ?? "");
	const [confirmed, setConfirmed] = useState<AuthToken | null>(state.check.pending ? state.token : null);
	const [proof, setProof] = useState("");
	const restored = useRef(false);
	const {
		pending, failure, run
	} = useExclusiveTask();

	const restart = (): void => {
		setConfirmed(null);
		setProof("");
		setChoice("");
	};

	const settle = useCallback(async (kept: AuthToken, chosen: AccountCollisionChoice, proven: string): Promise<void> => {
		await auth.saveToken(kept);
		setConfirmed(kept);
		await sendChoice(kept, chosen, {
			proof: proven, onStale: restart
		});
		await onAuthenticated(kept);
	}, [auth, onAuthenticated]);

	const keep = (chosen: AccountCollisionChoice): void => run(async (): Promise<void> => {
		setChoice(chosen);
		const verified = await verifiedAccounts(state, state.check.current === ACCOUNT_COLLISION_CHOICES.EMAIL);
		setProof(verified.proof.proof);
		await settle(verified[chosen], chosen, verified.proof.proof);
	});

	const resume = useCallback((): void => run(async (): Promise<void> => {
		if (!isAccountCollisionOpen(state.check)) {
			await onAuthenticated(state.token);
			return;
		}
		if (confirmed && choice) {
			await settle(confirmed, choice, proof);
		}
	}), [
		state,
		onAuthenticated,
		confirmed,
		choice,
		proof,
		settle,
		run
	]);

	useEffect((): void => {
		if (!isAccountCollisionOpen(state.check) && !restored.current) {
			restored.current = true;
			resume();
		}
	}, [state.check, resume]);

	return {
		confirmed: confirmed !== null, choice, pending, failure, keep, resume
	};
}

type KeepBoth = {
	changing: boolean;

	/** The new address waits for its confirmation link: the collision ends once it is opened. */
	awaitingLink: boolean;
	failed: boolean;
	failure: string | null;
	change: () => void;
};

type CollisionWatch = {
	opening: boolean; failure: string | null;
};

function useCollisionWatch(token: AuthToken, onAuthenticated: (token: AuthToken) => Promise<void>, watching: boolean): CollisionWatch {
	const [opening, setOpening] = useState(false);
	const [failure, setFailure] = useState<string | null>(null);
	const checking = useRef(false);
	const openingSession = useRef(false);
	const authenticate = useEffectEvent(onAuthenticated);
	useEffect(() => {
		if (!watching) {
			return undefined;
		}
		let cancelled = false;
		const recheck = async (): Promise<void> => {
			if (cancelled) {
				return;
			}
			if (checking.current || openingSession.current) {
				return;
			}
			checking.current = true;
			let startedOpening = false;
			try {
				const check = await RestApi.checkAccountCollision(await accessToken(token));
				if (cancelled) {
					return;
				}
				setFailure(null);
				if (!isAccountCollisionOpen(check)) {
					openingSession.current = true;
					startedOpening = true;
					setOpening(true);
					await authenticate(token);
				}
			}
			catch (error) {
				if (startedOpening) {
					openingSession.current = false;
				}
				if (!cancelled) {
					setOpening(false);
					setFailure(failureText(error));
				}
			}
			finally {
				checking.current = false;
			}
		};
		const recheckWhenActive = (): void => {
			if (AppState.currentState !== "background" && AppState.currentState !== "inactive") {
				recheck();
			}
		};
		recheckWhenActive();
		const timer = setInterval(recheckWhenActive, COLLISION_RECHECK_MS);
		const subscription = AppState.addEventListener("change", appState => {
			if (appState === "active") {
				recheckWhenActive();
			}
		});
		return (): void => {
			cancelled = true;
			clearInterval(timer);
			subscription.remove();
		};
	}, [token, watching]);
	return {
		opening, failure
	};
}

/** Gives the email account another address, then lets the player in as soon as the two accounts no longer collide */
function useKeepBoth(state: AccountCollisionLoginState, onAuthenticated: (token: AuthToken) => Promise<void>, disabled: boolean): KeepBoth {
	const email = state.check.collision?.email;
	const { token } = state;
	const [awaitingLink, setAwaitingLink] = useState(false);
	const onOutcome = useCallback((outcome: AccountActionOutcome): void => {
		if (outcome !== ACCOUNT_ACTION_OUTCOMES.CANCELLED) {
			setAwaitingLink(true);
		}
	}, []);
	const changeEmail = useCallback((): Promise<AccountActionOutcome> => KeycloakAuth.changeEmail(email), [email]);
	const action = useAccountAction(changeEmail, onOutcome);
	const watch = useCollisionWatch(token, onAuthenticated, awaitingLink && !disabled);

	return {
		changing: action.running || watch.opening, awaitingLink, failed: action.failed, failure: watch.failure, change: action.start
	};
}

function accountOf(collision: AccountCollision, kind: AccountCollisionChoice): CollisionAccount {
	return kind === ACCOUNT_COLLISION_CHOICES.DISCORD ? collision.discord : collision.emailAccount;
}

/** The account the player is signed in with comes first: it is the one they expect to see. */
function accountsInOrder(current: AccountCollisionChoice): AccountCollisionChoice[] {
	return current === ACCOUNT_COLLISION_CHOICES.EMAIL
		? [ACCOUNT_COLLISION_CHOICES.EMAIL, ACCOUNT_COLLISION_CHOICES.DISCORD]
		: [ACCOUNT_COLLISION_CHOICES.DISCORD, ACCOUNT_COLLISION_CHOICES.EMAIL];
}

function KeepBothSection({
	keepBoth, disabled
}: {
	keepBoth: KeepBoth; disabled: boolean;
}): ReactElement {
	return <>
		<SectionHeader>{i18n.t("app:auth.collision.keepBoth.title")}</SectionHeader>
		<Card>
			<Note>{i18n.t("app:auth.collision.keepBoth.explanation")}</Note>
			<EntryRow
				emblem={<AtSign size={KEEP_BOTH_EMBLEM_SIZE} />}
				title={i18n.t("app:auth.collision.keepBoth.action")}
				disabled={keepBoth.changing || disabled}
				onPress={keepBoth.change}
			/>
		</Card>
		{keepBoth.awaitingLink ? <Note>{i18n.t("app:auth.collision.keepBoth.awaitingLink")}</Note> : null}
		{keepBoth.failed ? <Refusal>{i18n.t("app:auth.collision.keepBoth.failed")}</Refusal> : null}
		{keepBoth.failure ? <Refusal>{keepBoth.failure}</Refusal> : null}
	</>;
}

/** Both accounts side by side, each with what tells it apart and the button that keeps it */
function ChoiceView({
	collision, current, flow, keepBoth, onCancel
}: {
	collision: AccountCollision;
	current: AccountCollisionChoice;
	flow: CollisionChoiceFlow;
	keepBoth: KeepBoth;
	onCancel: () => void;
}): ReactElement {
	const busy = flow.pending || keepBoth.changing;
	const proof = i18n.t(current === ACCOUNT_COLLISION_CHOICES.EMAIL ? "app:auth.collision.proveDiscord" : "app:auth.collision.proveEmail");
	return <Screen>
		<Standing caption={i18n.t("app:auth.collision.caption")} title={i18n.t("app:auth.collision.title")} subtitle={collision.email} />
		<Note>{i18n.t(`app:auth.collision.intro.${current}`)}</Note>
		<SectionHeader>{i18n.t("app:auth.collision.choose")}</SectionHeader>
		<Note>{i18n.t("app:auth.collision.deletion")}</Note>
		<TaskStatus failure={flow.failure} pending={busy} />
		{accountsInOrder(current).map(kind => <CollisionAccountCard
			key={kind}
			kind={kind}
			account={accountOf(collision, kind)}
			current={kind === current}
			keep={{
				detail: proof, pending: flow.pending && flow.choice === kind, disabled: busy, onPress: (): void => flow.keep(kind)
			}}
		/>)}
		<KeepBothSection keepBoth={keepBoth} disabled={flow.pending} />
		<ButtonRow><Button disabled={busy} onPress={onCancel}>{i18n.t("app:common.back")}</Button></ButtonRow>
	</Screen>;
}

/** Resumes a confirmed choice, or opens a session whose collision is already settled. */
function ResumeView({ flow }: { flow: CollisionChoiceFlow }): ReactElement {
	return <Screen>
		<Standing caption={i18n.t("app:auth.collision.caption")} title={i18n.t(flow.confirmed ? "app:auth.collision.resumeTitle" : "app:auth.loginTitle")} />
		{flow.confirmed ? <Note>{i18n.t("app:auth.collision.resumeNote")}</Note> : null}
		<TaskStatus failure={flow.failure} pending={flow.pending} />
		<ActionBanner icon={Check} label={i18n.t(flow.confirmed ? "app:auth.collision.resume" : "app:common.continue")} pending={flow.pending} onPress={flow.resume} />
	</Screen>;
}

export function AccountCollisionScreen({
	state, onAuthenticated, onCancel
}: {
	state: AccountCollisionLoginState;
	onAuthenticated: (token: AuthToken) => Promise<void>;
	onCancel: () => void;
}): ReactElement {
	const flow = useCollisionChoice(state, onAuthenticated);
	const keepBoth = useKeepBoth(state, onAuthenticated, flow.pending || flow.confirmed);
	const collision = state.check.collision;
	if (flow.confirmed || !collision) {
		return <ResumeView flow={flow} />;
	}
	return <ChoiceView collision={collision} current={state.check.current ?? ACCOUNT_COLLISION_CHOICES.DISCORD} flow={flow} keepBoth={keepBoth} onCancel={onCancel} />;
}
