import { DataControllerString } from "./DataController";
import { Data } from "./Data";
export class MapType extends Data<string> {}

export class MapTypeDataController extends DataControllerString<MapType> {
	static readonly instance: MapTypeDataController = new MapTypeDataController("mapTypes");

	private missionsMapsCache: MapType[] = null;

	newInstance(): MapType {
		return new MapType();
	}
}
