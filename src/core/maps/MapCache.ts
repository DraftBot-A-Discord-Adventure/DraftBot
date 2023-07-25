import {MapLink, MapLinks} from "../database/game/models/MapLink";
import {MapConstants} from "../constants/MapConstants";
import {RandomUtils} from "../utils/RandomUtils";
import {LogsMapLinks} from "../database/logs/models/LogsMapLinks";
import {Op, Sequelize} from "sequelize";

export abstract class MapCache {
	static boatEntryMapLinks: number[];

	static entryAndExitBoatMapLinks: number[];

	static regenFightPointsMapLinks: number[];

	static pveIslandMapLinks: number[];

	static allPveMapLinks: number[];

	static continentMapLinks: number[];

	static logsPveIslandMapLinks: number[];

	static async init(): Promise<void> {
		// Boat links entry only
		const boatEntryMapLinksObjects = await MapLinks.getFromAttributeToAttribute(MapConstants.MAP_ATTRIBUTES.MAIN_CONTINENT, MapConstants.MAP_ATTRIBUTES.PVE_ISLAND_ENTRY);
		this.boatEntryMapLinks = boatEntryMapLinksObjects
			.map((mapLink) => mapLink.id);

		// Boat links entry and exit
		const entryAndExitBoatMapLinksObjects = await MapLinks.getFromAttributeToAttribute(MapConstants.MAP_ATTRIBUTES.PVE_EXIT, MapConstants.MAP_ATTRIBUTES.CONTINENT1);
		this.entryAndExitBoatMapLinks = entryAndExitBoatMapLinksObjects
			.map((mapLink) => mapLink.id)
			.concat(this.boatEntryMapLinks);

		// PVE island map links
		const pveIslandMapLinksObjects = (await MapLinks.getFromAttributeToAttribute(MapConstants.MAP_ATTRIBUTES.PVE_ISLAND_ENTRY, MapConstants.MAP_ATTRIBUTES.PVE_ISLAND))
			.concat(await MapLinks.getFromAttributeToAttribute(MapConstants.MAP_ATTRIBUTES.PVE_ISLAND, MapConstants.MAP_ATTRIBUTES.PVE_ISLAND));
		this.pveIslandMapLinks = pveIslandMapLinksObjects
			.map((pveLink) => pveLink.id);

		// Get the logs equivalence
		// First create a list of literal tuples (because I didn't find how to do it in sequelize)
		const pveMapTuples = boatEntryMapLinksObjects
			.concat(entryAndExitBoatMapLinksObjects)
			.concat(pveIslandMapLinksObjects)
			.map((mapLink) => Sequelize.literal(`(${mapLink.startMap},${mapLink.endMap})`));
		this.logsPveIslandMapLinks = (await LogsMapLinks.findAll({
			where: {
				[Op.and]: [ // We need an and to be able to create a column with a custom name
					Sequelize.where(Sequelize.literal("(start,end)"), { [Op.in]: pveMapTuples })
				]
			}
		})).map((mapLink) => mapLink.id);

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
		if (MapCache.boatEntryMapLinks.length === 1) {
			return MapCache.boatEntryMapLinks[0];
		}

		return RandomUtils.draftbotRandom.pick(MapCache.boatEntryMapLinks.filter((id) => excludeLinkId !== id));
	}
}