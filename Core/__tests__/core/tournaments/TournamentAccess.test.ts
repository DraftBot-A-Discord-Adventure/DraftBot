import {
	beforeEach, describe, expect, it, vi
} from "vitest";
import {
	CommandTournamentErrorPacketRes, TournamentErrorCodes
} from "../../../../Lib/src/packets/commands/CommandTournamentPacket";
import {
	TournamentStatus, TournamentStatuses
} from "../../../../Lib/src/types/Tournament";

const mocks = vi.hoisted(() => ({
	findUpToDateTournamentForContext: vi.fn(),
	processDueTournaments: vi.fn(),
	getParticipant: vi.fn()
}));

vi.mock("../../../src/core/tournaments/TournamentLifecycle", () => ({
	findUpToDateTournamentForContext: mocks.findUpToDateTournamentForContext,
	processDueTournaments: mocks.processDueTournaments
}));

vi.mock("../../../src/core/tournaments/TournamentQueries", () => ({
	getParticipant: mocks.getParticipant
}));

import { verifyCommandAccess } from "../../../src/core/tournaments/TournamentAccess";
import { TournamentAccessResults } from "../../../src/core/tournaments/TournamentTypes";

const player = { id: 7 } as never;
const context = {} as never;

function givenTournament(status: TournamentStatus): void {
	mocks.findUpToDateTournamentForContext.mockResolvedValue({
		id: 42,
		status
	});
}

function getErrorCode(response: unknown[]): string | undefined {
	return (response.find(packet => packet instanceof CommandTournamentErrorPacketRes) as CommandTournamentErrorPacketRes | undefined)?.errorCode;
}

describe("Tournament command access", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.getParticipant.mockResolvedValue({ id: 1 });
	});

	it("does not restrict commands outside of an active tournament channel", async () => {
		mocks.findUpToDateTournamentForContext.mockResolvedValue(null);
		const response: unknown[] = [];
		expect(await verifyCommandAccess(player, context, response as never, "none")).toBe(TournamentAccessResults.ALLOWED);
		expect(mocks.findUpToDateTournamentForContext).toHaveBeenCalledWith(context);
		expect(mocks.processDueTournaments).not.toHaveBeenCalled();
		expect(response).toHaveLength(0);
	});

	it("does not look for a tournament when the command bypasses tournament restrictions", async () => {
		const response: unknown[] = [];
		expect(await verifyCommandAccess(player, context, response as never, "bypass")).toBe(TournamentAccessResults.ALLOWED);
		expect(mocks.findUpToDateTournamentForContext).not.toHaveBeenCalled();
	});

	it("never processes every tournament when checking a command in a tournament channel", async () => {
		givenTournament(TournamentStatuses.COMBAT);
		await verifyCommandAccess(player, context, [] as never, "fight");
		expect(mocks.processDueTournaments).not.toHaveBeenCalled();
	});

	it("rejects unrelated commands in an active tournament channel", async () => {
		givenTournament(TournamentStatuses.COMBAT);
		const response: unknown[] = [];
		expect(await verifyCommandAccess(player, context, response as never, "none")).toBe(TournamentAccessResults.DENIED);
		expect(getErrorCode(response)).toBe(TournamentErrorCodes.ACCESS_DENIED);
	});

	it("explains that fights have not started yet during registrations", async () => {
		givenTournament(TournamentStatuses.REGISTRATION);
		const response: unknown[] = [];
		expect(await verifyCommandAccess(player, context, response as never, "fight")).toBe(TournamentAccessResults.DENIED);
		expect(getErrorCode(response)).toBe(TournamentErrorCodes.COMBAT_NOT_STARTED);
	});

	it("asks non-participants to register before fighting", async () => {
		givenTournament(TournamentStatuses.COMBAT);
		mocks.getParticipant.mockResolvedValue(null);
		const response: unknown[] = [];
		expect(await verifyCommandAccess(player, context, response as never, "fight")).toBe(TournamentAccessResults.DENIED);
		expect(getErrorCode(response)).toBe(TournamentErrorCodes.NOT_REGISTERED);
	});

	it("flags participant fights so world requirements are skipped", async () => {
		givenTournament(TournamentStatuses.COMBAT);
		const response: unknown[] = [];
		expect(await verifyCommandAccess(player, context, response as never, "fight")).toBe(TournamentAccessResults.TOURNAMENT_FIGHT);
		expect(response).toHaveLength(0);
	});
});
