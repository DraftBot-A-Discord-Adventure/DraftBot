import {
	type APIGatewaySessionStartLimit, RESTGetAPIGatewayBotResult, Routes
} from "discord-api-types/v10";
import {
	fetchRecommendedShardCount, REST, type Shard, type ShardingManager
} from "discord.js";
import { CrowniclesLogger } from "../../../Lib/src/logs/CrowniclesLogger";
import { getShardSpawnRetryDelay } from "./ShardSpawnRetryUtils";

const REQUIRED_SESSIONS_PER_SHARD = 1;
const SHARD_RETRY_JITTER_MAX_MS = 5_000;

// Minimum spacing between two shard identifications, same as the discord.js ShardingManager default
const SHARD_SPAWN_DELAY_MS = 5_500;

type ShardRetryReason = "Gateway session-start quota exhausted" | "bounded startup backoff";

interface ShardRetryPlan {
	delayMs: number;
	reason: ShardRetryReason;
}

type ShardRetryTimer = ReturnType<typeof setTimeout>;

/**
 * Respawns dead or failed shards with a bounded backoff that honours Discord's session-start quota
 */
export class ShardSpawnSupervisor {
	private readonly rest: REST;

	private readonly retryAttempts = new Map<number, number>();

	private readonly pendingRetries = new Set<number>();

	private readonly retryTimers = new Map<number, ShardRetryTimer>();

	private readonly ignoredDeaths = new Set<Shard>();

	private readonly retriesWaitingSpawnSlot = new Set<number>();

	private nextSpawnSlotAt = 0;

	public constructor(private readonly discordClientToken: string) {
		this.rest = new REST({ version: "10" }).setToken(discordClientToken);
	}

	/**
	 * Spawn every shard of the fleet; unlike ShardingManager.spawn, a shard failing its startup is handed to the
	 * supervisor instead of aborting the creation of the following shards
	 */
	public async spawnFleet(shardingManager: ShardingManager): Promise<void> {
		const shardCount = await fetchRecommendedShardCount(this.discordClientToken);
		shardingManager.totalShards = shardCount;
		shardingManager.shardList = [...Array(shardCount).keys()];

		for (const shardId of shardingManager.shardList) {
			const shard = shardingManager.createShard(shardId);
			await this.spawnPaced(shard).catch(error => {
				CrowniclesLogger.errorWithObj(`Error while spawning shard ${shardId}`, error);
				this.handleSpawnFailure(shard);
			});
		}
	}

	/**
	 * Spawn a shard once its identification slot is reached: every launch, first spawn or retry, goes through
	 * this gate so two identifications are never closer than SHARD_SPAWN_DELAY_MS
	 */
	public async spawnPaced(shard: Shard): Promise<void> {
		await this.waitForSpawnSlot();
		await shard.spawn();
	}

	private waitForSpawnSlot(): Promise<void> {
		const now = Date.now();
		const slotAt = Math.max(now, this.nextSpawnSlotAt);
		this.nextSpawnSlotAt = slotAt + SHARD_SPAWN_DELAY_MS;
		return slotAt > now ? new Promise(resolve => setTimeout(resolve, slotAt - now)) : Promise.resolve();
	}

	/**
	 * Schedule a respawn whenever the shard dies, unless the death was requested through killIntentionally
	 */
	public watch(shard: Shard): void {
		shard.on("ready", () => this.clearRetry(shard.id));
		shard.on("death", () => {
			if (this.ignoredDeaths.delete(shard)) {
				return;
			}

			CrowniclesLogger.error(`Shard ${shard.id} exited`);
			this.scheduleRetry(shard).then();
		});
	}

	/**
	 * Kill a shard without scheduling a respawn; returns false when the kill failed
	 */
	public killIntentionally(shard: Shard): boolean {
		this.clearRetry(shard.id);
		if (!shard.process && !shard.worker) {
			return true;
		}

		this.ignoredDeaths.add(shard);
		try {
			shard.kill();
			return true;
		}
		catch (error) {
			this.ignoredDeaths.delete(shard);
			CrowniclesLogger.errorWithObj(`Error while intentionally killing shard ${shard.id}`, error);
			return false;
		}
	}

	/**
	 * Drop any pending respawn of the given shard, e.g. before replacing it
	 */
	public cancelRetry(shardId: number): void {
		this.clearRetry(shardId);
	}

	/**
	 * Clean up a shard whose spawn failed and schedule its respawn
	 */
	public handleSpawnFailure(shard: Shard): void {
		if (shard.process || shard.worker) {
			try {
				shard.kill();
			}
			catch (error) {
				CrowniclesLogger.errorWithObj(`Error while cleaning up failed shard ${shard.id}`, error);
			}
		}

		if (!shard.process && !shard.worker) {
			this.scheduleRetry(shard).then();
		}
	}

	private clearRetry(shardId: number): void {
		const retryTimer = this.retryTimers.get(shardId);
		if (retryTimer) {
			clearTimeout(retryTimer);
			this.retryTimers.delete(shardId);
		}

		this.pendingRetries.delete(shardId);
		this.retriesWaitingSpawnSlot.delete(shardId);
		this.retryAttempts.delete(shardId);
	}

	private async scheduleRetry(shard: Shard): Promise<void> {
		if (this.pendingRetries.has(shard.id) || this.retryTimers.has(shard.id)) {
			return;
		}

		const attempt = (this.retryAttempts.get(shard.id) ?? 0) + 1;
		this.retryAttempts.set(shard.id, attempt);
		this.pendingRetries.add(shard.id);

		try {
			const retryPlan = await this.getRetryPlan(attempt);
			if (this.retryAttempts.get(shard.id) !== attempt) {
				this.pendingRetries.delete(shard.id);
				return;
			}

			this.pendingRetries.delete(shard.id);
			const retryAt = new Date(Date.now() + retryPlan.delayMs).toISOString();
			CrowniclesLogger.warn(`Shard ${shard.id} retry scheduled at ${retryAt} (${retryPlan.reason}, attempt ${attempt})`);

			const retryTimer = setTimeout(() => {
				this.retryTimers.delete(shard.id);
				this.respawnPaced(shard).catch(error => {
					CrowniclesLogger.errorWithObj(`Error while respawning shard ${shard.id}`, error);
					this.handleSpawnFailure(shard);
				});
			}, retryPlan.delayMs);
			this.retryTimers.set(shard.id, retryTimer);
		}
		catch (error) {
			this.pendingRetries.delete(shard.id);
			CrowniclesLogger.errorWithObj(`Error while scheduling shard ${shard.id} retry`, error);
		}
	}

	/**
	 * Respawn a shard through the pacing gate, unless its retry was cancelled while waiting for its slot
	 */
	private async respawnPaced(shard: Shard): Promise<void> {
		this.retriesWaitingSpawnSlot.add(shard.id);
		await this.waitForSpawnSlot();
		if (!this.retriesWaitingSpawnSlot.delete(shard.id)) {
			return;
		}
		await shard.spawn();
	}

	private async getRetryPlan(attempt: number): Promise<ShardRetryPlan> {
		const sessionStartLimit = await this.getSessionStartLimit();
		const quotaExhausted = sessionStartLimit !== undefined
			&& sessionStartLimit.remaining < REQUIRED_SESSIONS_PER_SHARD;

		return {
			delayMs: getShardSpawnRetryDelay({
				attempt,
				requiredSessions: REQUIRED_SESSIONS_PER_SHARD,
				sessionStartLimit,
				jitterMs: this.getRetryJitterMs()
			}),
			reason: quotaExhausted
				? "Gateway session-start quota exhausted"
				: "bounded startup backoff"
		};
	}

	private async getSessionStartLimit(): Promise<APIGatewaySessionStartLimit | undefined> {
		try {
			const gatewayInfo = await this.rest.get(Routes.gatewayBot()) as RESTGetAPIGatewayBotResult;
			return gatewayInfo.session_start_limit;
		}
		catch (error) {
			CrowniclesLogger.errorWithObj("Unable to fetch Discord Gateway session limit", error);
			return undefined;
		}
	}

	private getRetryJitterMs(): number {
		return Math.floor(Math.random() * (SHARD_RETRY_JITTER_MAX_MS + 1));
	}
}
