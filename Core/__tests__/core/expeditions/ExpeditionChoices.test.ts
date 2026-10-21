import {
	afterEach, describe, expect, it, vi
} from "vitest";
import { generateExpeditionChoices } from "../../../src/core/expeditions/ExpeditionService";
import { MapLinkDataController } from "../../../src/data/MapLink";
import { ExpeditionConstants } from "../../../../Lib/src/constants/ExpeditionConstants";
import { ExpeditionData } from "../../../../Lib/src/packets/commands/CommandPetExpeditionPacket";
import { RandomUtils } from "../../../../Lib/src/utils/RandomUtils";

const ETENDUE = 12;
const LAKE_MIRAGE = 14;
const CRAB_RIVER = 25;
const GENERATIONS_PER_CASE = 20;
const TRIP_START = 0.2;
const TRIP_END = 0.8;
const ARRIVED = 1;

const {
	PLAINS, COAST, SWAMP
} = ExpeditionConstants.EXPEDITION_LOCATION_TYPES;

/**
 * Generate the expeditions proposed to a player at the given progress of the map link between two locations
 */
function expeditionChoices(startMap: number, endMap: number, travelProgress: number): ExpeditionData[] {
	const mapLinkId = MapLinkDataController.instance.getLinkByLocations(startMap, endMap)!.id;
	return generateExpeditionChoices({
		mapLinkId, travelProgress
	}, true);
}

/**
 * Location and biome of the local expeditions, in proposal order
 */
function localOffers(expeditions: ExpeditionData[]): string[] {
	return expeditions
		.filter(expedition => !expedition.isDistantExpedition)
		.map(expedition => `${expedition.mapLocationId}:${expedition.locationType}`);
}

function isShort(expedition: ExpeditionData): boolean {
	return expedition.durationMinutes >= ExpeditionConstants.DURATION_RANGES.SHORT.MIN
		&& expedition.durationMinutes <= ExpeditionConstants.DURATION_RANGES.SHORT.MAX;
}

function isMedium(expedition: ExpeditionData): boolean {
	return expedition.durationMinutes >= ExpeditionConstants.DURATION_RANGES.MEDIUM.MIN
		&& expedition.durationMinutes <= ExpeditionConstants.DURATION_RANGES.MEDIUM.MAX;
}

describe("expedition choices", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("offers short expeditions at the departure at the start of the trip, then one medium expedition per biome of the destination", () => {
		for (let i = 0; i < GENERATIONS_PER_CASE; i++) {
			const expeditions = expeditionChoices(ETENDUE, LAKE_MIRAGE, TRIP_START);

			expect(localOffers(expeditions)).toEqual([`${ETENDUE}:${PLAINS}`, `${LAKE_MIRAGE}:${COAST}`, `${LAKE_MIRAGE}:${SWAMP}`]);
			expect(isShort(expeditions[0])).toBe(true);
			expect(isMedium(expeditions[1]) && isMedium(expeditions[2])).toBe(true);
			expect(expeditions).toHaveLength(4);
			expect(expeditions[3].isDistantExpedition).toBe(true);
		}
	});

	it("offers the short expeditions at the destination once the player is closer to it, and when arrived", () => {
		for (const travelProgress of [TRIP_END, ARRIVED]) {
			for (let i = 0; i < GENERATIONS_PER_CASE; i++) {
				const expeditions = expeditionChoices(ETENDUE, LAKE_MIRAGE, travelProgress);

				expect(localOffers(expeditions)).toEqual([`${LAKE_MIRAGE}:${COAST}`, `${LAKE_MIRAGE}:${SWAMP}`, `${ETENDUE}:${PLAINS}`]);
				expect(isShort(expeditions[0]) && isShort(expeditions[1])).toBe(true);
				expect(isMedium(expeditions[2])).toBe(true);
			}
		}
	});

	it("gives the biomes of a location the same outing, only the terrain driven risk changing", () => {
		for (let i = 0; i < GENERATIONS_PER_CASE; i++) {
			const [coast, swamp] = expeditionChoices(ETENDUE, LAKE_MIRAGE, ARRIVED);

			expect(swamp.durationMinutes).toBe(coast.durationMinutes);
			expect(swamp.difficulty).toBe(coast.difficulty);
			expect(swamp.wealthRate).toBe(coast.wealthRate);
			expect(swamp.id).not.toBe(coast.id);

			// The swamp is a more dangerous terrain than the coast
			expect(swamp.riskRate).toBeGreaterThanOrEqual(coast.riskRate);
		}
	});

	it("offers every biome of both ends when they are both mixed", () => {
		expect(localOffers(expeditionChoices(LAKE_MIRAGE, CRAB_RIVER, TRIP_START)))
			.toEqual([`${LAKE_MIRAGE}:${COAST}`, `${LAKE_MIRAGE}:${SWAMP}`, `${CRAB_RIVER}:${COAST}`, `${CRAB_RIVER}:${SWAMP}`]);
	});

	it("can give the expedition bonus to any of the proposed expeditions", () => {
		vi.spyOn(RandomUtils.crowniclesRandom, "bool").mockReturnValue(true);
		vi.spyOn(RandomUtils, "randInt").mockImplementation((_min: number, max: number) => max - 1);
		const mapLinkId = MapLinkDataController.instance.getLinkByLocations(ETENDUE, LAKE_MIRAGE)!.id;

		const expeditions = generateExpeditionChoices({
			mapLinkId, travelProgress: TRIP_START
		}, false);

		expect(expeditions.map(expedition => expedition.hasCloneTalismanBonus === true)).toEqual([false, false, false, true]);
	});
});
