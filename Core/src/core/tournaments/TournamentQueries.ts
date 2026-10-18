import { Op } from "sequelize";
import { PacketContext } from "../../../../Lib/src/packets/CrowniclesPacket";
import {
	ACTIVE_STATUSES, CONTEXT_STATUSES
} from "./TournamentRules";
import { Tournament } from "../database/game/models/Tournament";
import { TournamentParticipant } from "../database/game/models/TournamentParticipant";
import { TournamentCode } from "../database/game/models/TournamentCode";
import {
	TournamentStatuses, type TournamentMenuSummary
} from "../../../../Lib/src/types/Tournament";
import { TournamentErrorCodes } from "../../../../Lib/src/packets/commands/CommandTournamentPacket";
import { TournamentDomainError } from "./TournamentErrors";
import { AsyncLock } from "../../../../Lib/src/locks/AsyncLock";

export type TournamentChannel = {
	guildId: string;
	channelId: string;
};

const tournamentChannelLocks = new Map<string, AsyncLock>();

function buildTournamentChannelLockKey(channel: TournamentChannel): string {
	return `${channel.guildId}:${channel.channelId}`;
}

function getTournamentChannelLock(channel: TournamentChannel): AsyncLock {
	const key = buildTournamentChannelLockKey(channel);
	let lock = tournamentChannelLocks.get(key);
	if (!lock) {
		lock = new AsyncLock();
		tournamentChannelLocks.set(key, lock);
	}
	return lock;
}

/**
 * Serialize the operations placing a tournament in a channel (creation and resume),
 * so that the channel availability check and the write it guards cannot interleave.
 * The body must include both the check and the commit of the write.
 * @param channel
 * @param body
 */
export async function withTournamentChannelLock<T>(channel: TournamentChannel, body: () => Promise<T>): Promise<T> {
	const release = await getTournamentChannelLock(channel).acquire();
	try {
		return await body();
	}
	finally {
		release();
	}
}

/**
 * Ensure no tournament in registration, combat or pause already uses the given channel
 * @param channel The channel that will host the tournament
 * @param ignoredTournamentId The tournament about to use the channel, if it already exists
 */
export async function assertChannelIsFree(channel: TournamentChannel, ignoredTournamentId?: number): Promise<void> {
	const tournamentInChannel = await Tournament.findOne({
		where: {
			discordGuildId: channel.guildId,
			discordChannelId: channel.channelId,
			status: { [Op.in]: ACTIVE_STATUSES },
			...ignoredTournamentId !== undefined ? { id: { [Op.ne]: ignoredTournamentId } } : {}
		}
	});
	if (tournamentInChannel) {
		throw new TournamentDomainError(TournamentErrorCodes.CHANNEL_ALREADY_USED);
	}
}

export async function findTournamentForContext(context: PacketContext, includeFinished: boolean): Promise<Tournament | null> {
	if (!Tournament.sequelize) {
		return null;
	}
	const guildId = context.frontEndSubOrigin;
	const channelIds = [context.discord?.channel, context.discord?.parentChannel]
		.filter((channelId): channelId is string => Boolean(channelId));
	if (!guildId || channelIds.length === 0) {
		return null;
	}
	return await Tournament.findOne({
		where: {
			discordGuildId: guildId,
			discordChannelId: { [Op.in]: channelIds },
			status: { [Op.in]: includeFinished ? CONTEXT_STATUSES : ACTIVE_STATUSES }
		},
		order: [["id", "DESC"]]
	});
}

export async function findLatestTournamentForGuild(discordGuildId: string): Promise<Tournament | null> {
	if (!Tournament.sequelize || !discordGuildId) {
		return null;
	}
	return await Tournament.findOne({
		where: {
			discordGuildId,
			status: { [Op.in]: CONTEXT_STATUSES }
		},
		order: [["id", "DESC"]]
	});
}

export async function getParticipant(tournamentId: number, playerId: number): Promise<TournamentParticipant | null> {
	return await TournamentParticipant.findOne({
		where: {
			tournamentId,
			playerId
		}
	});
}

async function toTournamentMenuSummary(tournament: Tournament): Promise<TournamentMenuSummary> {
	return {
		id: tournament.id,
		status: tournament.status,
		discordChannelId: tournament.discordChannelId,
		registrationEndsAt: tournament.registrationEndsAt.getTime(),
		combatEndsAt: tournament.combatEndsAt.getTime(),
		participantCount: await TournamentParticipant.count({
			where: { tournamentId: tournament.id }
		})
	};
}

export async function getTournamentAdminMenuData(discordGuildId: string): Promise<{
	tournaments: TournamentMenuSummary[];
	hasAvailableCode: boolean;
}> {
	const tournaments = await Tournament.findAll({
		where: {
			discordGuildId,
			status: { [Op.in]: ACTIVE_STATUSES }
		},
		order: [["id", "DESC"]]
	});
	const availableCode = await TournamentCode.findOne({
		where: {
			discordGuildId,
			consumedAt: null,
			expiresAt: { [Op.gt]: new Date() }
		},
		order: [["id", "DESC"]]
	});
	return {
		tournaments: await Promise.all(tournaments.map(toTournamentMenuSummary)),
		hasAvailableCode: availableCode !== null
	};
}

export async function getTournamentOwnerMenuData(discordGuildId: string): Promise<{
	pausedTournaments: TournamentMenuSummary[];
}> {
	const tournaments = await Tournament.findAll({
		where: {
			discordGuildId,
			status: TournamentStatuses.PAUSED
		},
		order: [["id", "DESC"]]
	});
	return {
		pausedTournaments: await Promise.all(tournaments.map(toTournamentMenuSummary))
	};
}
