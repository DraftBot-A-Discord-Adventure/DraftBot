import {
	beforeEach, describe, expect, it, vi
} from "vitest";
import { Op } from "sequelize";
import {
	TournamentCancellationReasons, TournamentNotificationEvents, TournamentStatus, TournamentStatuses
} from "../../../../Lib/src/types/Tournament";

type TournamentRow = {
	id: number;
	status: TournamentStatus;
	registrationEndsAt: Date;
	combatEndsAt: Date;
	startedNotificationSent: boolean;
	endingNotificationSent: boolean;
	endedNotificationSent: boolean;
	cancellationReason: string | null;
	rewardsDistributed: boolean;
	save: () => Promise<void>;
	reload: () => Promise<void>;
};

type WhereClause = Record<string | symbol, unknown>;

const mocks = vi.hoisted(() => ({
	findAll: vi.fn(),
	withLocked: vi.fn(),
	findParticipants: vi.fn(),
	countParticipants: vi.fn(),
	findTournamentForContext: vi.fn(),
	claimTournamentEvent: vi.fn()
}));

vi.mock("../../../src/core/database/game/models/Tournament", () => {
	class Tournament {
		static sequelize = {};

		static findAll = mocks.findAll;

		static withLocked = mocks.withLocked;
	}
	return {
		Tournament,
		default: Tournament
	};
});

vi.mock("../../../src/core/database/game/models/TournamentParticipant", () => {
	class TournamentParticipant {
		static findAll = mocks.findParticipants;

		static count = mocks.countParticipants;
	}
	return {
		TournamentParticipant,
		default: TournamentParticipant
	};
});

vi.mock("../../../src/core/database/game/models/Player", () => ({ default: { findAll: vi.fn() } }));

vi.mock("../../../../Lib/src/locks/withLockedEntities", () => ({ withLockedEntities: vi.fn() }));

vi.mock("../../../../Lib/src/logs/CrowniclesLogger", () => ({ CrowniclesLogger: { errorWithObj: vi.fn() } }));

vi.mock("../../../src/core/tournaments/TournamentNotifications", () => ({ claimTournamentEvent: mocks.claimTournamentEvent }));

vi.mock("../../../src/core/tournaments/TournamentQueries", () => ({ findTournamentForContext: mocks.findTournamentForContext }));

import {
	findUpToDateTournamentForContext, processDueTournament, processDueTournaments
} from "../../../src/core/tournaments/TournamentLifecycle";

const DAY_MS = 24 * 60 * 60 * 1000;
const context = {} as never;

function buildTournament(id: number, status: TournamentStatus, overrides: Partial<TournamentRow> = {}): TournamentRow {
	return {
		id,
		status,
		registrationEndsAt: new Date(Date.now() + DAY_MS),
		combatEndsAt: new Date(Date.now() + 3 * DAY_MS),
		startedNotificationSent: true,
		endingNotificationSent: false,
		endedNotificationSent: false,
		cancellationReason: null,
		rewardsDistributed: false,
		save: vi.fn().mockResolvedValue(undefined),
		reload: vi.fn().mockResolvedValue(undefined),
		...overrides
	};
}

function matchesCondition(value: unknown, condition: unknown): boolean {
	if (typeof condition === "object" && condition !== null && Op.in in condition) {
		return ((condition as WhereClause)[Op.in] as unknown[]).includes(value);
	}
	return value === condition;
}

function matchesWhere(row: TournamentRow, where: WhereClause): boolean {
	const orClauses = where[Op.or] as WhereClause[] | undefined;
	if (orClauses && !orClauses.some(clause => matchesWhere(row, clause))) {
		return false;
	}
	return Object.entries(where)
		.every(([field, condition]) => matchesCondition(row[field as keyof TournamentRow], condition));
}

/**
 * Lets the mocked table answer findAll by evaluating the generated where clause on its rows
 */
function givenTournamentTable(rows: TournamentRow[]): void {
	mocks.findAll.mockImplementation(({ where }: { where: WhereClause }) => Promise.resolve(rows.filter(row => matchesWhere(row, where))));
}

function getLockedTournamentIds(): number[] {
	return mocks.withLocked.mock.calls.map(([id]) => id as number);
}

describe("Tournament due processing", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.withLocked.mockImplementation((id: number, body: (tournament: TournamentRow) => Promise<unknown>) =>
			body(buildTournament(id, TournamentStatuses.COMPLETED)));
		mocks.findParticipants.mockResolvedValue([]);
	});

	it("never loads nor locks finished tournaments whose ended notification was already sent", async () => {
		const notifiedCompleted = buildTournament(1, TournamentStatuses.COMPLETED, { endedNotificationSent: true });
		const notifiedCancelled = buildTournament(2, TournamentStatuses.CANCELLED, { endedNotificationSent: true });
		const pendingCompleted = buildTournament(3, TournamentStatuses.COMPLETED);
		const paused = buildTournament(4, TournamentStatuses.PAUSED);
		givenTournamentTable([
			notifiedCompleted,
			notifiedCancelled,
			pendingCompleted,
			paused
		]);

		await processDueTournaments();

		expect(getLockedTournamentIds()).toEqual([pendingCompleted.id]);
		expect(mocks.claimTournamentEvent).toHaveBeenCalledTimes(1);
		expect(mocks.claimTournamentEvent).toHaveBeenCalledWith(pendingCompleted.id, {
			event: TournamentNotificationEvents.ENDED,
			cancellationReason: undefined
		});
	});

	it("still loads running tournaments so their deadlines are processed", async () => {
		const expiredRegistration = buildTournament(5, TournamentStatuses.REGISTRATION, {
			registrationEndsAt: new Date(Date.now() - DAY_MS)
		});
		mocks.withLocked.mockImplementation((_id: number, body: (tournament: TournamentRow) => Promise<unknown>) => body(expiredRegistration));
		givenTournamentTable([expiredRegistration]);

		await processDueTournaments();

		expect(getLockedTournamentIds()).toEqual([expiredRegistration.id]);
		expect(expiredRegistration.status).toBe(TournamentStatuses.CANCELLED);
	});

	it("takes no lock when no notification is ready", async () => {
		await processDueTournament(buildTournament(6, TournamentStatuses.COMPLETED, { endedNotificationSent: true }) as never);
		await processDueTournament(buildTournament(7, TournamentStatuses.COMBAT, {
			registrationEndsAt: new Date(Date.now() - DAY_MS)
		}) as never);

		expect(mocks.withLocked).not.toHaveBeenCalled();
		expect(mocks.claimTournamentEvent).not.toHaveBeenCalled();
	});

	it("re-checks a ready notification under lock before claiming it", async () => {
		const combat = buildTournament(8, TournamentStatuses.COMBAT, {
			registrationEndsAt: new Date(Date.now() - DAY_MS),
			startedNotificationSent: false
		});
		mocks.withLocked.mockImplementation((id: number, body: (tournament: TournamentRow) => Promise<unknown>) =>
			body(buildTournament(id, TournamentStatuses.COMBAT, { startedNotificationSent: true })));

		await processDueTournament(combat as never);

		expect(getLockedTournamentIds()).toEqual([combat.id]);
		expect(mocks.claimTournamentEvent).not.toHaveBeenCalled();
	});
});

describe("Tournament ending notification", () => {
	const HOUR_MS = 60 * 60 * 1000;

	function buildTournamentInEndingWindow(id: number): TournamentRow {
		return buildTournament(id, TournamentStatuses.COMBAT, {
			registrationEndsAt: new Date(Date.now() - 2 * DAY_MS),
			combatEndsAt: new Date(Date.now() + HOUR_MS),
			endingNotificationSent: true
		});
	}

	beforeEach(() => {
		vi.clearAllMocks();
		mocks.withLocked.mockImplementation((id: number, body: (tournament: TournamentRow) => Promise<unknown>) =>
			body(buildTournamentInEndingWindow(id)));
	});

	it("takes no lock once every participant received the ending notification", async () => {
		mocks.countParticipants.mockResolvedValue(0);
		const tournament = buildTournamentInEndingWindow(11);

		await processDueTournament(tournament as never);

		expect(mocks.countParticipants).toHaveBeenCalledWith({
			where: {
				tournamentId: tournament.id,
				endingNotificationSent: false
			}
		});
		expect(mocks.withLocked).not.toHaveBeenCalled();
		expect(mocks.claimTournamentEvent).not.toHaveBeenCalled();
	});

	it("still notifies a late registrant who did not receive the ending notification", async () => {
		mocks.countParticipants.mockResolvedValue(1);
		const tournament = buildTournamentInEndingWindow(12);

		await processDueTournament(tournament as never);

		expect(getLockedTournamentIds()).toEqual([tournament.id]);
		expect(mocks.claimTournamentEvent).toHaveBeenCalledWith(tournament.id, { event: TournamentNotificationEvents.ENDING });
	});

	it("locks without counting participants while the ending announcement itself is pending", async () => {
		const tournament = buildTournamentInEndingWindow(13);
		tournament.endingNotificationSent = false;

		await processDueTournament(tournament as never);

		expect(mocks.countParticipants).not.toHaveBeenCalled();
		expect(mocks.claimTournamentEvent).toHaveBeenCalledWith(tournament.id, { event: TournamentNotificationEvents.ENDING });
	});
});

describe("Tournament processing for a command context", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.findParticipants.mockResolvedValue([]);
	});

	it("processes and locks nothing when the context has no tournament", async () => {
		mocks.findTournamentForContext.mockResolvedValue(null);

		expect(await findUpToDateTournamentForContext(context)).toBeNull();

		expect(mocks.findAll).not.toHaveBeenCalled();
		expect(mocks.withLocked).not.toHaveBeenCalled();
	});

	it("processes the context tournament and returns its up-to-date state", async () => {
		const expiredRegistration = buildTournament(9, TournamentStatuses.REGISTRATION, {
			registrationEndsAt: new Date(Date.now() - DAY_MS)
		});
		mocks.withLocked.mockImplementation((_id: number, body: (tournament: TournamentRow) => Promise<unknown>) => body(expiredRegistration));
		mocks.findTournamentForContext
			.mockResolvedValueOnce(buildTournament(9, TournamentStatuses.REGISTRATION, {
				registrationEndsAt: new Date(Date.now() - DAY_MS)
			}))
			.mockImplementation(() => Promise.resolve(expiredRegistration.status === TournamentStatuses.REGISTRATION ? expiredRegistration : null));

		expect(await findUpToDateTournamentForContext(context)).toBeNull();

		expect(mocks.findAll).not.toHaveBeenCalled();
		expect(getLockedTournamentIds()).toEqual([expiredRegistration.id]);
		expect(expiredRegistration.cancellationReason).toBe(TournamentCancellationReasons.TOO_FEW_PARTICIPANTS);
		expect(mocks.claimTournamentEvent).toHaveBeenCalledWith(expiredRegistration.id, {
			event: TournamentNotificationEvents.ENDED,
			cancellationReason: TournamentCancellationReasons.TOO_FEW_PARTICIPANTS
		});
	});

	it("returns the context tournament unchanged when nothing is due", async () => {
		const registration = buildTournament(10, TournamentStatuses.REGISTRATION);
		mocks.findTournamentForContext.mockResolvedValue(registration);

		expect(await findUpToDateTournamentForContext(context)).toBe(registration);

		expect(mocks.withLocked).not.toHaveBeenCalled();
	});
});
