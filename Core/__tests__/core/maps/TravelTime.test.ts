import { beforeEach, describe, expect, it, vi } from 'vitest';

// Stub the draftBotInstance module to avoid initialising the bot and file system errors
vi.mock('../../../src', () => ({
	draftBotInstance: {
		logsDatabase: {
			logTimeWarp: vi.fn(),
			logAlteration: vi.fn()
		}
	}
}));

import { MapLinkDataController } from '../../../src/data/MapLink';
import { PVEConstants } from '../../../../Lib/src/constants/PVEConstants';
import { Constants } from '../../../../Lib/src/constants/Constants';
import { PlayerSmallEvents } from '../../../src/core/database/game/models/PlayerSmallEvent';
import { draftBotInstance } from '../../../src';
import { RandomUtils } from '../../../../Lib/src/utils/RandomUtils';
import { Maps } from '../../../src/core/maps/Maps';
import { TravelTime } from '../../../src/core/maps/TravelTime';
import { Effect } from '../../../../Lib/src/types/Effect';

describe('TravelTime', () => {
	const now = Date.now();

	beforeEach(() => {
		vi.restoreAllMocks();
		vi.spyOn(Date, 'now').mockReturnValue(now);

		// Mock MapLinkDataController
		vi.spyOn(MapLinkDataController.instance, 'getById').mockReturnValue({ id: 5, startMap: 1, endMap: 2, tripDuration: 10 });

		// Mock Maps
		vi.spyOn(Maps, 'isOnPveIsland').mockReturnValue(false);

		// Override constants
		Object.defineProperty(PVEConstants, 'TIME_BETWEEN_SMALL_EVENTS', { value: 600_000, writable: true });
		Object.defineProperty(Constants.REPORT, 'TIME_BETWEEN_MINI_EVENTS', { value: 300_000, writable: true });

		// Mock PlayerSmallEvents
		vi.spyOn(PlayerSmallEvents, 'getLastOfPlayer').mockResolvedValue(null);
		vi.spyOn(PlayerSmallEvents, 'calculateCurrentScore').mockResolvedValue(50);

		// Mock random
		vi.spyOn(RandomUtils.draftbotRandom, 'integer').mockReturnValue(5);
	});

	it('calculates simplified travel data correctly', () => {
		const start = now - 1000;
		const effectDurationMin = 5;
		const effectDurationMs = effectDurationMin * 60000;
		const player: any = {
			startTravelDate: new Date(start),
			effectEndDate: new Date(start + effectDurationMs),
			effectDuration: effectDurationMin,
			mapLinkId: 1
		};
		const date = new Date(start + effectDurationMs + 2000);
		const data = TravelTime.getTravelDataSimplified(player, date);

		expect(data.travelStartTime).toBe(start);
		expect(data.effectDuration).toBe(effectDurationMs);
		expect(data.effectStartTime).toBe(start);
		expect(data.effectEndTime).toBe(start + effectDurationMs);
		expect(data.playerTravelledTime).toBe((date.valueOf() - start) - effectDurationMs);
		expect(data.travelEndTime).toBe(start + effectDurationMs + 10 * 60000);
	});

	it('gets travel data with small events', async () => {
		const start = now - 10000;
		const effectDurationMin = 2;
		const effectDurationMs = effectDurationMin * 60000;
		const lastEvent = { time: start + 1000 };

		vi.spyOn(PlayerSmallEvents, 'getLastOfPlayer').mockResolvedValueOnce(lastEvent as any);
		vi.spyOn(Maps, 'isOnPveIsland').mockReturnValueOnce(true);
		Object.defineProperty(PVEConstants, 'TIME_BETWEEN_SMALL_EVENTS', { value: 200000, writable: true });

		const player: any = {
			id: 1,
			startTravelDate: new Date(start),
			effectEndDate: new Date(start + effectDurationMs),
			effectDuration: effectDurationMin,
			mapLinkId: 1
		};
		const result = await TravelTime.getTravelData(player, new Date(now));

		expect(result.travelStartTime).toBe(start);
		expect(result.effectEndTime).toBe(start + effectDurationMs);
		expect(result.nextSmallEventTime).toBe(Math.max(start, lastEvent.time, start + effectDurationMs) + 200000);
	});

	it('timeTravel moves dates and logs', async () => {
		const player: any = {
			effectEndDate: new Date(now + 5000),
			startTravelDate: new Date(now + 5000),
			id: 1,
			keycloakId: 'user123'
		};
		const small = { time: now + 3000, save: vi.fn() };
		vi.spyOn(PlayerSmallEvents, 'getLastOfPlayer').mockResolvedValueOnce(small as any);

		await TravelTime.timeTravel(player, 1, 0);

		expect(player.effectEndDate.valueOf()).toBe(now + 5000 - 60000);
		expect(player.startTravelDate.valueOf()).toBe(now + 5000 - 60000);
		expect(small.time).toBe(now + 3000 - 60000);
		expect(draftBotInstance.logsDatabase.logTimeWarp).toHaveBeenCalledWith('user123', 1, 0);
	});

	it('removeEffect clears effect and moves travel start', async () => {
		const tt = vi.spyOn(TravelTime, 'timeTravel').mockResolvedValue();
		const save = vi.fn().mockResolvedValue(undefined);
		const player: any = {
			effectRemainingTime: () => 2,
			effectDuration: 3,
			startTravelDate: new Date(now),
			effectEndDate: new Date(now + 2),
			effectId: 99,
			save
		};

		await TravelTime.removeEffect(player, 0);

		expect(tt).toHaveBeenCalled();
		expect(player.effectId).toBe(Effect.NO_EFFECT.id);
		expect(player.effectDuration).toBe(0);
		expect(player.effectEndDate.valueOf()).toBe(Date.now());
		expect(save).toHaveBeenCalled();
	});

	it('applyEffect sets new effect and logs', async () => {
		const save = vi.fn().mockResolvedValue(undefined);
		const player: any = {
			effectId: Effect.NO_EFFECT.id,
			effectDuration: 0,
			effectEndDate: new Date(now),
			save,
			keycloakId: 'user123'
		};

		await TravelTime.applyEffect(player, Effect.OCCUPIED, 5, new Date(now), 0);

		expect(player.effectId).toBe(Effect.OCCUPIED.id);
		expect(player.effectDuration).toBe(5);
		expect(player.effectEndDate.valueOf()).toBe(now + 5 * 60000);
		expect(save).toHaveBeenCalled();
		expect(draftBotInstance.logsDatabase.logAlteration).toHaveBeenCalled();
	});

	it('timeTravelledToScore returns non-negative score', () => {
		const score = TravelTime.timeTravelledToScore(10);
		expect(score).toBeGreaterThanOrEqual(0);
	});

	it('joinBoatScore calculates correct score scenarios', async () => {
		vi.spyOn(TravelTime, 'getTravelDataSimplified').mockReturnValue({ playerTravelledTime: 10 * 60000 } as any);
		let score = await TravelTime.joinBoatScore({} as any);
		expect(score).toBeGreaterThanOrEqual(0);

		vi.spyOn(TravelTime, 'getTravelDataSimplified').mockReturnValue({ playerTravelledTime: 40 * 60000 } as any);
		score = await TravelTime.joinBoatScore({} as any);
		expect(score).toBeGreaterThanOrEqual(0);

		vi.spyOn(TravelTime, 'getTravelDataSimplified').mockReturnValue({ playerTravelledTime: 70 * 60000 } as any);
		score = await TravelTime.joinBoatScore({} as any);
		expect(score).toBeGreaterThanOrEqual(0);
	});
});
