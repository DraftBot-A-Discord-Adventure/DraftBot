import {
	CommandTournamentContextPacketReq, CommandTournamentContextPacketRes, TournamentErrorCodes
} from "../../../../Lib/src/packets/commands/CommandTournamentPacket";
import {
	makePacket, PacketContext
} from "../../../../Lib/src/packets/CrowniclesPacket";
import { TournamentConstants } from "../../../../Lib/src/constants/TournamentConstants";
import { CrowniclesInteraction } from "../../messages/CrowniclesInteraction";
import { DiscordMQTT } from "../../bot/DiscordMQTT";
import { replyTournamentError } from "./TournamentCommandUtils";
import { CrowniclesLogger } from "../../../../Lib/src/logs/CrowniclesLogger";
import { CommandsManager } from "../CommandsManager";

type TournamentChannelCacheEntry = {
	active: boolean;

	// Past this date the state is still used but a refresh is requested from the Core
	refreshAt: number;

	// Value of stateVersion when the state was stored, see below
	version: number;
};

// Insertion order is update order: the least recently updated channels are at the front and evicted first once the cache is full
const tournamentChannelCache = new Map<string, TournamentChannelCacheEntry>();

// Channels whose state is being fetched from the Core, so concurrent commands in the same channel send a single query
const pendingChannelRefreshes = new Set<string>();

/*
 * Incremented on every local update. A Core answer is only stored if no local update happened since its query was sent,
 * otherwise an answer computed before a tournament creation could hide it
 */
let stateVersion = 0;

// Value of stateVersion at the last invalidation of every channel: answers to queries sent before it are discarded
let invalidationVersion = 0;

/**
 * Whether a command can be used in a tournament channel, as declared by the command itself
 * @param commandName
 */
export function isAllowedInTournament(commandName: string): boolean {
	return CommandsManager.commands.get(commandName)?.allowedInTournament === true;
}

/**
 * Records the state of a channel, either answered by the Core or known from a Core response (tournament creation or resume)
 * @param channelId
 * @param active
 */
export function setTournamentChannelState(channelId: string, active: boolean): void {
	tournamentChannelCache.delete(channelId);
	if (tournamentChannelCache.size >= TournamentConstants.CONTEXT_CACHE_MAX_ENTRIES) {
		tournamentChannelCache.delete(tournamentChannelCache.keys().next().value!);
	}
	tournamentChannelCache.set(channelId, {
		active,
		refreshAt: Date.now() + TournamentConstants.CONTEXT_CACHE_TTL_MS,
		version: ++stateVersion
	});
}

/**
 * Requests a refresh of every known channel on their next command, when a tournament changed without the front knowing its channel.
 * The last known states are kept until then, so an active tournament channel is never considered free meanwhile
 */
export function invalidateTournamentChannelCache(): void {
	for (const entry of tournamentChannelCache.values()) {
		entry.refreshAt = 0;
	}
	invalidationVersion = ++stateVersion;
}

/**
 * Forgets every known channel state, only meant to isolate tests
 */
export function resetTournamentChannelCache(): void {
	tournamentChannelCache.clear();
	pendingChannelRefreshes.clear();
	invalidationVersion = ++stateVersion;
}

function queryTournamentChannel(context: PacketContext): Promise<boolean | null> {
	return new Promise(resolve => {
		DiscordMQTT.asyncPacketSender.sendPacketAndHandleResponse(
			context,
			makePacket(CommandTournamentContextPacketReq, {}),
			(_responseContext, _packetName, responsePacket) => {
				resolve((responsePacket as CommandTournamentContextPacketRes).active);
				return Promise.resolve();
			},
			{
				timeoutMs: TournamentConstants.CONTEXT_QUERY_TIMEOUT_MS,
				onTimeout: (): void => resolve(null)
			}
		).catch(() => resolve(null));
	});
}

function isAnswerUpToDate(channelId: string, queryVersion: number): boolean {
	return queryVersion >= invalidationVersion && (tournamentChannelCache.get(channelId)?.version ?? 0) <= queryVersion;
}

async function refreshTournamentChannelState(channelId: string, context: PacketContext): Promise<void> {
	const queryVersion = stateVersion;
	try {
		// The query must run on its own copy: sending it assigns a packetId to the context, which the command packet must not inherit
		const active = await queryTournamentChannel({ ...context });

		// A failed query is not cached so the next command retries it: the Core still rejects the commands it handles meanwhile
		if (active !== null && isAnswerUpToDate(channelId, queryVersion)) {
			setTournamentChannelState(channelId, active);
		}
	}
	catch (error) {
		CrowniclesLogger.errorWithObj("Failed to refresh the tournament state of a channel", error);
	}
	finally {
		pendingChannelRefreshes.delete(channelId);
	}
}

function scheduleTournamentChannelRefresh(channelId: string, context: PacketContext): void {
	if (pendingChannelRefreshes.has(channelId)) {
		return;
	}
	pendingChannelRefreshes.add(channelId);
	refreshTournamentChannelState(channelId, context).then();
}

/**
 * Only reads the local cache so the command is never delayed by the Core, whose answer could exceed the delay Discord gives to acknowledge the interaction.
 * An outdated state is still used while it is refreshed in the background, so an active tournament channel never lets a command through when its state expires.
 * Only an unknown channel lets the command through, its state being fetched for the next commands
 * @param interaction
 * @param context
 */
function isKnownTournamentChannel(interaction: CrowniclesInteraction, context: PacketContext): boolean {
	const cached = tournamentChannelCache.get(interaction.channelId);
	if (!cached || cached.refreshAt <= Date.now()) {
		scheduleTournamentChannelRefresh(interaction.channelId, context);
	}
	return cached?.active ?? false;
}

export async function checkTournamentCommandAccess(
	interaction: CrowniclesInteraction,
	context: PacketContext
): Promise<boolean> {
	if (!interaction.guild || isAllowedInTournament(interaction.commandName)) {
		return true;
	}
	if (!isKnownTournamentChannel(interaction, context)) {
		return true;
	}
	await replyTournamentError(interaction, TournamentErrorCodes.ACCESS_DENIED);
	return false;
}
