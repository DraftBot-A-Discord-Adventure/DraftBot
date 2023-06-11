import {MapLink, MapLinks} from "../database/game/models/MapLink";
import {MapConstants} from "../constants/MapConstants";

export abstract class MapCache {
	static boatMapLinks: number[];

	static regenFightPointsMapLinks: number[];

	static pveIslandMapLinks: number[];

	static allPveMapLinks: number[];

	static continentMapLinks: number[];

	static async init(): Promise<void> {
		// Boat links
		this.boatMapLinks = (await MapLinks.getFromAttributeToAttribute(MapConstants.MAP_ATTRIBUTES.MAIN_CONTINENT, MapConstants.MAP_ATTRIBUTES.PVE_ISLAND_ENTRY))
			.concat(await MapLinks.getFromAttributeToAttribute(MapConstants.MAP_ATTRIBUTES.PVE_EXIT, MapConstants.MAP_ATTRIBUTES.CONTINENT1))
			.map((mapLink) => mapLink.id);

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
}