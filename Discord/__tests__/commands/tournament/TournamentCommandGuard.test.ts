import {
	afterEach, beforeAll, beforeEach, describe, expect, it, vi
} from "vitest";
import { PermissionsBitField } from "discord.js";
import { ICommand } from "../../../src/commands/ICommand";

const { registeredCommands } = vi.hoisted(() => ({ registeredCommands: new Map<string, ICommand>() }));

vi.mock("../../../src/commands/CommandsManager", () => ({
	CommandsManager: { commands: registeredCommands }
}));

import {
	checkTournamentCommandAccess, clearTournamentChannelCache, isAllowedInTournament
} from "../../../src/commands/tournament/TournamentCommandGuard";
import { DiscordMQTT } from "../../../src/bot/DiscordMQTT";
import { replyTournamentError } from "../../../src/commands/tournament/TournamentCommandUtils";
import { TournamentConstants } from "../../../../Lib/src/constants/TournamentConstants";
import {
	CommandTournamentContextPacketReq, TournamentErrorCodes
} from "../../../../Lib/src/packets/commands/CommandTournamentPacket";
import {
	CrowniclesPacket, PacketContext
} from "../../../../Lib/src/packets/CrowniclesPacket";
import { CrowniclesInteraction } from "../../../src/messages/CrowniclesInteraction";
import { commandInfo as tournamentAdminCommandInfo } from "../../../src/commands/tournament/TournamentAdminCommand";
import { commandInfo as tournamentOwnerCommandInfo } from "../../../src/commands/tournament/TournamentOwnerCommand";
import { commandInfo } from "../../../src/commands/tournament/TournamentStatusCommand";
import { commandInfo as fightCommandInfo } from "../../../src/commands/player/FightCommand";
import { commandInfo as topCommandInfo } from "../../../src/commands/player/TopCommand";
import { commandInfo as notificationsCommandInfo } from "../../../src/commands/notifications/NotificationsCommand";
import { commandInfo as inventoryCommandInfo } from "../../../src/commands/player/InventoryCommand";

vi.mock("../../../src/bot/CrowniclesShard", () => ({
	discordConfig: {},
	keycloakConfig: {},
	crowniclesClient: null,
	shardId: 0
}));

vi.mock("../../../src/bot/DiscordMQTT", () => ({
	DiscordMQTT: {
		asyncPacketSender: {
			sendPacketAndHandleResponse: vi.fn()
		}
	}
}));

vi.mock("../../../src/commands/tournament/TournamentCommandUtils", async importOriginal => ({
	...await importOriginal<typeof import("../../../src/commands/tournament/TournamentCommandUtils")>(),
	replyTournamentError: vi.fn()
}));

type ContextQueryCallback = (context: PacketContext, packetName: string, packet: CrowniclesPacket) => Promise<void>;

type SentContextQuery = {
	context: PacketContext;
	answer: (active: boolean) => Promise<void>;
};

const sendPacketAndHandleResponse = vi.mocked(DiscordMQTT.asyncPacketSender.sendPacketAndHandleResponse);

function getSentContextQueries(): SentContextQuery[] {
	return sendPacketAndHandleResponse.mock.calls
		.filter(([, packet]) => packet instanceof CommandTournamentContextPacketReq)
		.map(([context, , callback]) => ({
			context,
			answer: (active: boolean): Promise<void> => (callback as ContextQueryCallback)(context, "CommandTournamentContextPacketRes", { active } as CrowniclesPacket)
		}));
}

function makeInteraction(channelId: string, commandName = "inventory"): CrowniclesInteraction {
	return {
		channelId,
		commandName,
		guild: { id: "guild" }
	} as unknown as CrowniclesInteraction;
}

function makeContext(): PacketContext {
	return { keycloakId: "player" } as PacketContext;
}

function flushBackgroundRefreshes(): Promise<void> {
	return new Promise(resolve => setImmediate(resolve));
}

beforeAll(() => {
	for (const command of [
		commandInfo,
		tournamentAdminCommandInfo,
		tournamentOwnerCommandInfo,
		fightCommandInfo,
		topCommandInfo,
		notificationsCommandInfo,
		inventoryCommandInfo
	]) {
		registeredCommands.set(command.slashCommandBuilder.name, command);
	}
});

async function markChannel(channelId: string, active: boolean): Promise<void> {
	const queriesBefore = getSentContextQueries().length;
	expect(await checkTournamentCommandAccess(makeInteraction(channelId), makeContext())).toBe(true);
	const queries = getSentContextQueries();
	expect(queries).toHaveLength(queriesBefore + 1);
	await queries[queries.length - 1].answer(active);
	await flushBackgroundRefreshes();
}

describe("checkTournamentCommandAccess", () => {
	beforeEach(() => {
		clearTournamentChannelCache();
		sendPacketAndHandleResponse.mockReset();
		sendPacketAndHandleResponse.mockResolvedValue();
		vi.mocked(replyTournamentError).mockReset();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("does not wait for a Core that never answers on a cache miss", async () => {
		sendPacketAndHandleResponse.mockReturnValue(new Promise<void>(() => {
			// The Core never answers
		}));
		const context = makeContext();

		expect(await checkTournamentCommandAccess(makeInteraction("channel"), context)).toBe(true);

		const queries = getSentContextQueries();
		expect(queries).toHaveLength(1);
		expect(replyTournamentError).not.toHaveBeenCalled();

		// The background query must not assign its packetId to the context the command packet is sent with
		expect(queries[0].context).not.toBe(context);
	});

	it("sends a single background query for concurrent commands in the same channel", async () => {
		await checkTournamentCommandAccess(makeInteraction("channel"), makeContext());
		await checkTournamentCommandAccess(makeInteraction("channel"), makeContext());
		await checkTournamentCommandAccess(makeInteraction("other-channel"), makeContext());

		expect(getSentContextQueries()).toHaveLength(2);
	});

	it("denies other commands once the channel is known to host a tournament", async () => {
		await markChannel("channel", true);

		expect(await checkTournamentCommandAccess(makeInteraction("channel"), makeContext())).toBe(false);
		expect(replyTournamentError).toHaveBeenCalledWith(expect.anything(), TournamentErrorCodes.ACCESS_DENIED);
		expect(await checkTournamentCommandAccess(makeInteraction("channel", "fight"), makeContext())).toBe(true);
		expect(getSentContextQueries()).toHaveLength(1);
	});

	it("lets commands through in a channel known to have no tournament", async () => {
		await markChannel("channel", false);

		expect(await checkTournamentCommandAccess(makeInteraction("channel"), makeContext())).toBe(true);
		expect(getSentContextQueries()).toHaveLength(1);
	});

	it("ignores an answer sent before the cache was cleared", async () => {
		await checkTournamentCommandAccess(makeInteraction("channel"), makeContext());
		const [staleQuery] = getSentContextQueries();
		clearTournamentChannelCache();

		await staleQuery.answer(true);
		await flushBackgroundRefreshes();

		expect(await checkTournamentCommandAccess(makeInteraction("channel"), makeContext())).toBe(true);
		expect(getSentContextQueries()).toHaveLength(2);
	});

	it("queries the Core again once the cached state expired", async () => {
		vi.useFakeTimers({ toFake: ["Date"] });
		await markChannel("channel", true);

		vi.setSystemTime(Date.now() + TournamentConstants.CONTEXT_CACHE_TTL_MS);

		expect(await checkTournamentCommandAccess(makeInteraction("channel"), makeContext())).toBe(true);
		expect(getSentContextQueries()).toHaveLength(2);
	});

	it("evicts the oldest channel once the cache is full", async () => {
		for (let i = 0; i <= TournamentConstants.CONTEXT_CACHE_MAX_ENTRIES; i++) {
			await markChannel(`channel-${i}`, true);
		}

		// The most recent channel is still cached, the oldest one has been evicted and must be fetched again
		expect(await checkTournamentCommandAccess(makeInteraction(`channel-${TournamentConstants.CONTEXT_CACHE_MAX_ENTRIES}`), makeContext())).toBe(false);
		expect(await checkTournamentCommandAccess(makeInteraction("channel-0"), makeContext())).toBe(true);
		expect(getSentContextQueries()).toHaveLength(TournamentConstants.CONTEXT_CACHE_MAX_ENTRIES + 2);
	});
});

describe("TournamentCommandGuard", () => {
	it("lets tournament commands through, the Core checking participation", () => {
		expect(isAllowedInTournament("tournament")).toBe(true);
		expect(isAllowedInTournament("fight")).toBe(true);
		expect(isAllowedInTournament("top")).toBe(true);
	});

	it("rejects other commands in a tournament channel", () => {
		expect(isAllowedInTournament("notifications")).toBe(false);
		expect(isAllowedInTournament("inventory")).toBe(false);
	});

	it("allows the dedicated management roots through the context guard", () => {
		expect(isAllowedInTournament("tournament-admin")).toBe(true);
		expect(isAllowedInTournament("tournament-owner")).toBe(true);
	});

	it("rejects an unknown command", () => {
		expect(isAllowedInTournament("unknown")).toBe(false);
	});

	it("registers the player command as a global command", () => {
		expect(commandInfo.slashCommandBuilder.name).toBe("tournament");
		expect(commandInfo.mainGuildCommand).toBe(false);
	});

	it("registers management roots without options and with Discord permissions", () => {
		const adminCommand = tournamentAdminCommandInfo.slashCommandBuilder.toJSON();
		const ownerCommand = tournamentOwnerCommandInfo.slashCommandBuilder.toJSON();

		expect(adminCommand.options).toEqual([]);
		expect(ownerCommand.options).toEqual([]);
		expect(adminCommand.default_member_permissions).toBe(PermissionsBitField.Flags.Administrator.toString());
		expect(ownerCommand.default_member_permissions).toBe(PermissionsBitField.Flags.Administrator.toString());
	});
});