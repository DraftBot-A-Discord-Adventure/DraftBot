import {MapLink, MapLinks} from "../database/game/models/MapLink";
import {MapConstants} from "../constants/MapConstants";
import {RandomUtils} from "../utils/RandomUtils";

export abstract class MapCache {
	static boatEntryMapLinks: number[];

	static entryAndExitBoatMapLinks: number[];

	static regenFightPointsMapLinks: number[];

	static pveIslandMapLinks: number[];

	static allPveMapLinks: number[];

	static continentMapLinks: number[];

	static async init(): Promise<void> {
		// Boat links entry only
		this.boatEntryMapLinks = (await MapLinks.getFromAttributeToAttribute(MapConstants.MAP_ATTRIBUTES.MAIN_CONTINENT, MapConstants.MAP_ATTRIBUTES.PVE_ISLAND_ENTRY))
			.map((mapLink) => mapLink.id);

		// Boat links entry and exit
		this.entryAndExitBoatMapLinks = (await MapLinks.getFromAttributeToAttribute(MapConstants.MAP_ATTRIBUTES.PVE_EXIT, MapConstants.MAP_ATTRIBUTES.CONTINENT1))
			.map((mapLink) => mapLink.id)
			.concat(this.boatEntryMapLinks);

		// PVE island map links
		this.pveIslandMapLinks = (await MapLinks.getFromAttributeToAttribute(MapConstants.MAP_ATTRIBUTES.PVE_ISLAND_ENTRY, MapConstants.MAP_ATTRIBUTES.PVE_ISLAND))
			.concat(await MapLinks.getFromAttributeToAttribute(MapConstants.MAP_ATTRIBUTES.PVE_ISLAND, MapConstants.MAP_ATTRIBUTES.PVE_ISLAND))
			.map((pveLink) => pveLink.id);

		// All PVE links
		this.allPveMapLinks = (await MapLinks.getFromAttributeToAttribute(MapConstants.MAP_ATTRIBUTES.MAIN_CONTINENT, MapConstants.MAP_ATTRIBUTES.PVE_ISLAND_ENTRY))
			.concat(await MapLinks.getFromAttributeToAttribute(MapConstants.MAP_ATTRIBUTES.PVE_ISLAND, MapConstants.MAP_ATTRIBUTES.PVE_EXIT))
			.map((pveLink) => pveLink.id)
			.concat(this.pveIslandMapLinks);

		// Fight regen list
		this.regenFightPointsMapLinks = (await MapLink.findAll())
			.map((mapLink) => mapLink.id)
			.filter((mapLinkId) => !this.allPveMapLinks.includes(mapLinkId));

		// Continent maps (for now it's the same as fight regen maps, but later it may evolve, so we do this granularity
		this.continentMapLinks = this.regenFightPointsMapLinks;
	}

	/**
	 * Get a random pve boat link id
	 * @param excludeLinkId Exclude this link id from being returned if another one is available
	 */
	static randomPveBoatLinkId(excludeLinkId = -1): number {
		if (MapCache.entryAndExitBoatMapLinks.length === 1) {
			return MapCache.entryAndExitBoatMapLinks[0];
		}

		return RandomUtils.draftbotRandom.pick(MapCache.boatEntryMapLinks.filter((id) => excludeLinkId !== id));
	}
}