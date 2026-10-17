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
	expiresAt: number;
};

/*
 * Every entry shares the same TTL and is re-inserted on refresh, so the insertion order of this map is also its expiry order:
 * the oldest entries are always at the front
 */
const tournamentChannelCache = new Map<string, TournamentChannelCacheEntry>();

// Channels whose state is being fetched from the Core, so concurrent commands in the same channel send a single query
const pendingChannelRefreshes = new Set<string>();

// Bumped on every clear so a query sent before the clear cannot store an outdated state afterwards
let cacheGeneration = 0;

/**
 * Whether a command can be used in a tournament channel, as declared by the command itself
 * @param commandName
 */
export function isAllowedInTournament(commandName: string): boolean {
	return CommandsManager.commands.get(commandName)?.allowedInTournament === true;
}

export function clearTournamentChannelCache(): void {
	tournamentChannelCache.clear();
	pendingChannelRefreshes.clear();
	cacheGeneration++;
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

function getCachedTournamentChannelState(channelId: string): boolean | null {
	const cached = tournamentChannelCache.get(channelId);
	if (!cached) {
		return null;
	}
	if (cached.expiresAt <= Date.now()) {
		tournamentChannelCache.delete(channelId);
		return null;
	}
	return cached.active;
}

function storeTournamentChannelState(channelId: string, active: boolean): void {
	const now = Date.now();
	tournamentChannelCache.delete(channelId);
	for (const [key, entry] of tournamentChannelCache) {
		if (entry.expiresAt > now && tournamentChannelCache.size < TournamentConstants.CONTEXT_CACHE_MAX_ENTRIES) {
			break;
		}
		tournamentChannelCache.delete(key);
	}
	tournamentChannelCache.set(channelId, {
		active,
		expiresAt: now + TournamentConstants.CONTEXT_CACHE_TTL_MS
	});
}

async function refreshTournamentChannelState(channelId: string, context: PacketContext, generation: number): Promise<void> {
	try {
		// The query must run on its own copy: sending it assigns a packetId to the context, which the command packet must not inherit
		const active = await queryTournamentChannel({ ...context });

		// A failed query is not cached so the next command retries it: the Core still rejects the commands it handles meanwhile
		if (active !== null && generation === cacheGeneration) {
			storeTournamentChannelState(channelId, active);
		}
	}
	catch (error) {
		CrowniclesLogger.errorWithObj("Failed to refresh the tournament state of a channel", error);
	}
	finally {
		if (generation === cacheGeneration) {
			pendingChannelRefreshes.delete(channelId);
		}
	}
}

function scheduleTournamentChannelRefresh(channelId: string, context: PacketContext): void {
	if (pendingChannelRefreshes.has(channelId)) {
		return;
	}
	pendingChannelRefreshes.add(channelId);
	refreshTournamentChannelState(channelId, context, cacheGeneration).then();
}

/**
 * Only reads the local cache so the command is never delayed by the Core, whose answer could exceed the delay Discord gives to acknowledge the interaction.
 * On a cache miss the command goes through and the channel state is fetched in the background for the next commands
 * @param interaction
 * @param context
 */
function isKnownTournamentChannel(interaction: CrowniclesInteraction, context: PacketContext): boolean {
	const cached = getCachedTournamentChannelState(interaction.channelId);
	if (cached === null) {
		scheduleTournamentChannelRefresh(interaction.channelId, context);
		return false;
	}
	return cached;
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
