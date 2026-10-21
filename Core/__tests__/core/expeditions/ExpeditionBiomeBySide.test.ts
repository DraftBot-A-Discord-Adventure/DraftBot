import {
	describe, expect, it
} from "vitest";
import { generateThreeExpeditions } from "../../../src/core/expeditions/ExpeditionService";
import { MapLinkDataController } from "../../../src/data/MapLink";
import { MapLocationDataController } from "../../../src/data/MapLocation";
import { ExpeditionConstants } from "../../../../Lib/src/constants/ExpeditionConstants";
import { Biome } from "../../../../Lib/src/types/Biome";

const LAKE_MIRAGE = 14;
const ETENDUE = 12;
const CRAB_RIVER = 25;
const VACARME_RIVER = 18;
const GENERATIONS_PER_CASE = 20;

/**
 * Biomes of the two local expeditions (departure then destination) generated on the map link between two locations
 */
function localExpeditionBiomes(startMap: number, endMap: number): Biome[] {
	const mapLink = MapLinkDataController.instance.getLinkByLocations(startMap, endMap)!;
	return generateThreeExpeditions(mapLink.id, true)
		.filter(expedition => !expedition.isDistantExpedition)
		.map(expedition => expedition.locationType);
}

describe("expedition biome by side", () => {
	it("explores the side of a mixed location facing the location it is linked to", () => {
		const lakeMirage = MapLocationDataController.instance.getById(LAKE_MIRAGE)!;

		expect(lakeMirage.getBiomeFacing(ETENDUE)).toBe(ExpeditionConstants.EXPEDITION_LOCATION_TYPES.SWAMP);
		expect(lakeMirage.getBiomeFacing(CRAB_RIVER)).toBe(ExpeditionConstants.EXPEDITION_LOCATION_TYPES.COAST);
	});

	it("always explores the only biome of a single biome location", () => {
		const vacarmeRiver = MapLocationDataController.instance.getById(VACARME_RIVER)!;

		expect(vacarmeRiver.getBiomeFacing(LAKE_MIRAGE)).toBe(ExpeditionConstants.EXPEDITION_LOCATION_TYPES.COAST);
	});

	it("generates the same local expedition biomes on every draw for a given map link, whatever its direction", () => {
		for (let i = 0; i < GENERATIONS_PER_CASE; i++) {
			expect(localExpeditionBiomes(ETENDUE, LAKE_MIRAGE)).toEqual([
				ExpeditionConstants.EXPEDITION_LOCATION_TYPES.PLAINS,
				ExpeditionConstants.EXPEDITION_LOCATION_TYPES.SWAMP
			]);
			expect(localExpeditionBiomes(LAKE_MIRAGE, ETENDUE)).toEqual([
				ExpeditionConstants.EXPEDITION_LOCATION_TYPES.SWAMP,
				ExpeditionConstants.EXPEDITION_LOCATION_TYPES.PLAINS
			]);
			expect(localExpeditionBiomes(CRAB_RIVER, LAKE_MIRAGE)).toEqual([
				ExpeditionConstants.EXPEDITION_LOCATION_TYPES.COAST,
				ExpeditionConstants.EXPEDITION_LOCATION_TYPES.COAST
			]);
		}
	});
});
