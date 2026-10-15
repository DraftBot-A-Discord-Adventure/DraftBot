import { DatabasePoolConfiguration } from "../database/DatabaseConfiguration";
import { asMilliseconds } from "../types/TimeTypes";

/*
 * Sized from the `crownicles_db_pool_*` gauges (#4631): over 30 days the game pool sat at its former
 * implicit max of 5 with up to 9 queries waiting, the logs pool reached 3 used + 3 waiting.
 * Worst case for all services stays far below MariaDB `max_connections` (151, peak usage 34).
 */
const ACQUIRE_TIMEOUT = asMilliseconds(60_000);
const IDLE_TIMEOUT = asMilliseconds(10_000);

export abstract class DatabaseConstants {
	static readonly POOLS = {
		GAME: {
			max: 20,
			min: 0,
			acquire: ACQUIRE_TIMEOUT,
			idle: IDLE_TIMEOUT
		},
		LOGS: {
			max: 10,
			min: 0,
			acquire: ACQUIRE_TIMEOUT,
			idle: IDLE_TIMEOUT
		},

		// One pool per Discord shard process
		DISCORD: {
			max: 5,
			min: 0,
			acquire: ACQUIRE_TIMEOUT,
			idle: IDLE_TIMEOUT
		}
	} as const satisfies Record<string, DatabasePoolConfiguration>;
}
