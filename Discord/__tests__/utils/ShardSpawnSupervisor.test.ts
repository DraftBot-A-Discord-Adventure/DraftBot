import {
	afterEach, beforeEach, describe, expect, it, vi
} from "vitest";

const {
	fetchRecommendedShardCount, loggerError, loggerErrorWithObj, loggerWarn, restGet
} = vi.hoisted(() => ({
	fetchRecommendedShardCount: vi.fn(),
	loggerError: vi.fn(),
	loggerErrorWithObj: vi.fn(),
	loggerWarn: vi.fn(),
	restGet: vi.fn()
}));

vi.mock("discord.js", () => ({
	fetchRecommendedShardCount,
	REST: class {
		public setToken(): this {
			return this;
		}

		public get(...args: unknown[]): Promise<unknown> {
			return restGet(...args);
		}
	}
}));

vi.mock("../../../Lib/src/logs/CrowniclesLogger", () => ({
	CrowniclesLogger: {
		error: loggerError,
		errorWithObj: loggerErrorWithObj,
		warn: loggerWarn
	}
}));

import type {
	Shard, ShardingManager
} from "discord.js";
import { ShardSpawnSupervisor } from "../../src/utils/ShardSpawnSupervisor";

interface FakeShardOptions {
	process?: { pid: number } | null;
	worker?: { threadId: number } | null;
}

function createShard({
	process = null,
	worker = null
}: FakeShardOptions = {}): Shard {
	return {
		id: 0,
		process,
		worker,
		kill: vi.fn(),
		spawn: vi.fn(),
		on: vi.fn().mockReturnThis()
	} as unknown as Shard;
}

const SPAWN_DELAY_MS = 5_500;

function createFleet(count: number): {
	shards: Shard[];
	shardingManager: ShardingManager;
	identifications: number[];
} {
	const identifications: number[] = [];
	const shards = Array.from({ length: count }, (_, id) => {
		const shard = {
			...createShard(),
			id
		} as unknown as Shard;
		vi.mocked(shard.spawn).mockImplementation(() => {
			identifications.push(Date.now());
			return Promise.resolve(undefined as never);
		});
		return shard;
	});
	const shardingManager = {
		totalShards: "auto",
		shardList: "auto",
		createShard: vi.fn((id: number) => shards[id])
	} as unknown as ShardingManager;
	return {
		shards, shardingManager, identifications
	};
}

function getAvailableSessionLimit(): object {
	return {
		session_start_limit: {
			total: 1_000,
			remaining: 10,
			reset_after: 120_000,
			max_concurrency: 1
		}
	};
}

describe("ShardSpawnSupervisor", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.spyOn(Math, "random").mockReturnValue(0);
		restGet.mockReset();
		loggerError.mockReset();
		loggerErrorWithObj.mockReset();
		loggerWarn.mockReset();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it("does not try to kill an already dead shard", () => {
		const shard = createShard();
		const supervisor = new ShardSpawnSupervisor("token");

		expect(supervisor.killIntentionally(shard)).toBe(true);
		expect(shard.kill).not.toHaveBeenCalled();
	});

	it("cleans up a live shard without querying the Gateway", () => {
		const shard = createShard({ process: { pid: 123 } });
		const supervisor = new ShardSpawnSupervisor("token");

		expect(supervisor.killIntentionally(shard)).toBe(true);
		expect(shard.kill).toHaveBeenCalledOnce();
		expect(restGet).not.toHaveBeenCalled();
	});

	it("retries a failed spawn after bounded backoff", async () => {
		restGet.mockResolvedValue(getAvailableSessionLimit());
		const shard = createShard();
		shard.spawn = vi.fn().mockResolvedValue({});
		const supervisor = new ShardSpawnSupervisor("token");

		supervisor.handleSpawnFailure(shard);
		await vi.advanceTimersByTimeAsync(0);
		expect(restGet).toHaveBeenCalledOnce();
		expect(shard.spawn).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(5_000);
		expect(shard.spawn).toHaveBeenCalledOnce();
	});

	it("waits for the Gateway reset before retrying an exhausted quota", async () => {
		restGet.mockResolvedValue({
			session_start_limit: {
				total: 1_000,
				remaining: 0,
				reset_after: 60_000,
				max_concurrency: 1
			}
		});
		const shard = createShard();
		shard.spawn = vi.fn().mockResolvedValue({});
		const supervisor = new ShardSpawnSupervisor("token");

		supervisor.handleSpawnFailure(shard);
		await vi.advanceTimersByTimeAsync(0);
		await vi.advanceTimersByTimeAsync(59_999);
		expect(shard.spawn).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(1);
		expect(shard.spawn).toHaveBeenCalledOnce();
	});

	it("cancels a pending retry when a shard is replaced", async () => {
		restGet.mockResolvedValue(getAvailableSessionLimit());
		const shard = createShard();
		shard.spawn = vi.fn().mockResolvedValue({});
		const supervisor = new ShardSpawnSupervisor("token");

		supervisor.handleSpawnFailure(shard);
		await vi.advanceTimersByTimeAsync(0);
		supervisor.cancelRetry(shard.id);
		await vi.advanceTimersByTimeAsync(5_000);

		expect(shard.spawn).not.toHaveBeenCalled();
	});

	it("kills a still-running process after a spawn timeout", () => {
		const shard = createShard({ process: { pid: 123 } });
		const supervisor = new ShardSpawnSupervisor("token");

		supervisor.handleSpawnFailure(shard);

		expect(shard.kill).toHaveBeenCalledOnce();
		expect(restGet).not.toHaveBeenCalled();
	});

	it("keeps spawning the next shards when a shard fails its startup", async () => {
		fetchRecommendedShardCount.mockResolvedValue(3);
		restGet.mockResolvedValue(getAvailableSessionLimit());
		const shards = [0, 1, 2].map(id => ({
			...createShard(),
			id
		}) as unknown as Shard);
		vi.mocked(shards[0].spawn)
			.mockRejectedValueOnce(new Error("ShardingReadyTimeout"))
			.mockResolvedValue(undefined as never);
		vi.mocked(shards[1].spawn).mockResolvedValue(undefined as never);
		vi.mocked(shards[2].spawn).mockResolvedValue(undefined as never);
		const shardingManager = {
			totalShards: "auto",
			shardList: "auto",
			createShard: vi.fn((id: number) => shards[id])
		} as unknown as ShardingManager;
		const supervisor = new ShardSpawnSupervisor("token");

		const fleetSpawned = supervisor.spawnFleet(shardingManager);
		await vi.advanceTimersByTimeAsync(SPAWN_DELAY_MS * 3);
		await fleetSpawned;

		expect(shardingManager.totalShards).toBe(3);
		expect(shardingManager.createShard).toHaveBeenCalledTimes(3);
		expect(shards[1].spawn).toHaveBeenCalledOnce();
		expect(shards[2].spawn).toHaveBeenCalledOnce();

		await vi.runAllTimersAsync();
		expect(shards[0].spawn).toHaveBeenCalledTimes(2);
	});

	it("keeps every identification, retries included, at least the spawn delay apart", async () => {
		fetchRecommendedShardCount.mockResolvedValue(3);
		restGet.mockResolvedValue(getAvailableSessionLimit());
		const {
			shards, shardingManager, identifications
		} = createFleet(3);
		vi.mocked(shards[0].spawn).mockImplementationOnce(() => {
			identifications.push(Date.now());
			return Promise.reject(new Error("ShardingReadyDied"));
		});
		const supervisor = new ShardSpawnSupervisor("token");

		const fleetSpawned = supervisor.spawnFleet(shardingManager);
		await vi.advanceTimersByTimeAsync(SPAWN_DELAY_MS * 5);
		await fleetSpawned;

		expect(shards[0].spawn).toHaveBeenCalledTimes(2);
		expect(identifications).toHaveLength(4);
		const sortedIdentifications = [...identifications].sort((a, b) => a - b);
		for (let i = 1; i < sortedIdentifications.length; i++) {
			expect(sortedIdentifications[i] - sortedIdentifications[i - 1]).toBeGreaterThanOrEqual(SPAWN_DELAY_MS);
		}
	});

	it("does not respawn a shard whose retry was cancelled while waiting for its slot", async () => {
		fetchRecommendedShardCount.mockResolvedValue(3);
		restGet.mockResolvedValue(getAvailableSessionLimit());
		const {
			shards, shardingManager
		} = createFleet(3);
		vi.mocked(shards[0].spawn).mockRejectedValueOnce(new Error("ShardingReadyDied"));
		const supervisor = new ShardSpawnSupervisor("token");

		const fleetSpawned = supervisor.spawnFleet(shardingManager);
		await vi.advanceTimersByTimeAsync(5_000);
		supervisor.cancelRetry(0);
		await vi.advanceTimersByTimeAsync(SPAWN_DELAY_MS * 5);
		await fleetSpawned;

		expect(shards[0].spawn).toHaveBeenCalledOnce();
	});
});
