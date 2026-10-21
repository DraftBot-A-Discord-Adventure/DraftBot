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

/**
 * Generate the expeditions proposed on the map link between two locations
 */
function expeditionChoices(startMap: number, endMap: number): ExpeditionData[] {
	return generateExpeditionChoices(MapLinkDataController.instance.getLinkByLocations(startMap, endMap)!.id, true);
}

/**
 * Location and biome of the local expeditions, in proposal order
 */
function localOffers(expeditions: ExpeditionData[]): string[] {
	return expeditions
		.filter(expedition => !expedition.isDistantExpedition)
		.map(expedition => `${expedition.mapLocationId}:${expedition.locationType}`);
}

describe("expeditions of mixed biome locations", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("offers one expedition per biome of each end of the map link, then the distant expedition", () => {
		for (let i = 0; i < GENERATIONS_PER_CASE; i++) {
			const expeditions = expeditionChoices(ETENDUE, LAKE_MIRAGE);

			expect(localOffers(expeditions)).toEqual([
				`${ETENDUE}:${ExpeditionConstants.EXPEDITION_LOCATION_TYPES.PLAINS}`,
				`${LAKE_MIRAGE}:${ExpeditionConstants.EXPEDITION_LOCATION_TYPES.COAST}`,
				`${LAKE_MIRAGE}:${ExpeditionConstants.EXPEDITION_LOCATION_TYPES.SWAMP}`
			]);
			expect(expeditions).toHaveLength(4);
			expect(expeditions[3].isDistantExpedition).toBe(true);
		}
	});

	it("gives the departure biomes a short duration and the destination biomes a medium one", () => {
		for (let i = 0; i < GENERATIONS_PER_CASE; i++) {
			const [departure, destinationCoast, destinationSwamp] = expeditionChoices(ETENDUE, LAKE_MIRAGE);

			expect(departure.durationMinutes).toBeLessThanOrEqual(ExpeditionConstants.DURATION_RANGES.SHORT.MAX);
			for (const destination of [destinationCoast, destinationSwamp]) {
				expect(destination.durationMinutes).toBeGreaterThanOrEqual(ExpeditionConstants.DURATION_RANGES.MEDIUM.MIN);
				expect(destination.durationMinutes).toBeLessThanOrEqual(ExpeditionConstants.DURATION_RANGES.MEDIUM.MAX);
			}
		}
	});

	it("offers every biome of both ends when they are both mixed", () => {
		expect(localOffers(expeditionChoices(LAKE_MIRAGE, CRAB_RIVER))).toEqual([
			`${LAKE_MIRAGE}:${ExpeditionConstants.EXPEDITION_LOCATION_TYPES.COAST}`,
			`${LAKE_MIRAGE}:${ExpeditionConstants.EXPEDITION_LOCATION_TYPES.SWAMP}`,
			`${CRAB_RIVER}:${ExpeditionConstants.EXPEDITION_LOCATION_TYPES.COAST}`,
			`${CRAB_RIVER}:${ExpeditionConstants.EXPEDITION_LOCATION_TYPES.SWAMP}`
		]);
	});

	it("can give the expedition bonus to any of the proposed expeditions", () => {
		vi.spyOn(RandomUtils.crowniclesRandom, "bool").mockReturnValue(true);
		vi.spyOn(RandomUtils, "randInt").mockImplementation((_min: number, max: number) => max - 1);

		const expeditions = generateExpeditionChoices(MapLinkDataController.instance.getLinkByLocations(ETENDUE, LAKE_MIRAGE)!.id, false);

		expect(expeditions.map(expedition => expedition.hasCloneTalismanBonus === true)).toEqual([false, false, false, true]);
	});
});
