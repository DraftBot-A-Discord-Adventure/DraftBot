import {DataController} from "./DataController";
import {RandomUtils} from "../core/utils/RandomUtils";
import {MapLocationDataController} from "./MapLocation";
import {Data} from "./Data";

export class MapLink extends Data<number> {
    public readonly startMap: number;

    public readonly endMap: number;

    public readonly tripDuration: number;

    public readonly forcedImage?: string;
}

export class MapLinkDataController extends DataController<number, MapLink> {
    static readonly instance: MapLinkDataController = new MapLinkDataController("maplinks");

    newInstance(): MapLink {
        return new MapLink();
    }

    public getRandomLink(): MapLink {
        return RandomUtils.draftbotRandom.pick(this.getValuesArray());
    }

    public getLinkByLocations(idStartPoint: number, idEndPoint: number): MapLink {
        return this.getValuesArray().find((mapLink) => mapLink.startMap === idStartPoint && mapLink.endMap === idEndPoint);
    }

    public getLinksByMapStart(idStartPoint: number): MapLink[] {
        return this.getValuesArray().filter((mapLink) => mapLink.startMap === idStartPoint);
    }

    public getInverseLinkOf(idMapLink: number): MapLink {
        const currMapLink = this.data.get(idMapLink);
        return this.getValuesArray().find((mapLink) => mapLink.startMap === currMapLink.endMap && mapLink.endMap === currMapLink.startMap);
    }

    public getMapLinksWithMapTypes(mapTypes: string[], startMapId: number, blacklistMapId: number): MapLink[] {
        let blackListId = blacklistMapId ?? -1;
        return this.getValuesArray()
            .filter(
                (mapLink) => mapLink.startMap === startMapId &&
                    mapLink.endMap !== blackListId &&
                    mapTypes.includes(MapLocationDataController.instance.getById(mapLink.endMap).type)
            );
    }

    public getFromAttributeToAttribute(attributeFrom: string, attributeTo: string): MapLink[] {
        return this.getValuesArray()
            .filter(
                (mapLink) => {
                    const startMap = MapLocationDataController.instance.getById(mapLink.startMap);
                    const endMap = MapLocationDataController.instance.getById(mapLink.endMap);
                    return startMap.attribute === attributeFrom && endMap.attribute === attributeTo;
                }
            );
    }

    public getAll(): MapLink[] {
        return this.getValuesArray();
    }
}